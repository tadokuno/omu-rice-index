import fetch from 'node-fetch'; // ESモジュールでのfetch使用
import FormData from 'form-data'; // multipart/form-dataを送信するためのモジュール
import { createClient } from '@supabase/supabase-js'; // Supabaseクライアント

// Supabaseクライアントのセットアップ
const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ハバースィンの公式を使って2点間の距離を計算
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // 地球の半径（メートル）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 距離（メートル）
};

// 駅名と現在位置を使ってstation_idを取得する関数
const getStationId = async (stationName, userLat, userLng) => {
    // Supabaseからstation_nameを使って検索
    const { data: stations, error } = await supabase
        .from('station_master')
        .select('*')
        .eq('station_name', stationName);

    if (error) {
        throw new Error('Supabaseでの駅検索に失敗しました: ' + error.message);
    }

    if (stations.length === 0) {
        throw new Error('該当する駅が見つかりません');
    }

    // 駅が複数見つかった場合、最も近い駅を選択
    if (stations.length > 1) {
        let closestStation = stations[0];
        let closestDistance = calculateDistance(userLat, userLng, closestStation.lat, closestStation.lng);

        for (let i = 1; i < stations.length; i++) {
            const station = stations[i];
            const distance = calculateDistance(userLat, userLng, station.lat, station.lng);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestStation = station;
            }
        }

        return closestStation.station_id;
    } else {
        // 一つしか駅が見つからない場合
        return stations[0].station_id;
    }
};

// 画像のアップロードとデータのSupabaseへの登録
export const handler = async (event) => {
    console.log("UPLOAD START");
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST',
            },
        };
    }

    try {
        const body = JSON.parse(event.body);

        // Gyazo API用のアクセストークン
        const accessToken = process.env.GYAZO_ACCESS_TOKEN;

        // 現在位置とstation_nameを使ってstation_idを取得
        const stationId = await getStationId(body.station, body.userLat, body.userLng);
        // Gyazo APIに画像をアップロード
        const formData = new FormData();
        formData.append('access_token', accessToken);
        formData.append('imagedata', Buffer.from(body.image, 'base64'), body.fileName);

        console.error(formData);
        const response = await fetch('https://upload.gyazo.com/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Gyazoへのアップロードに失敗しました');
        }

        const result = await response.json();
        const imageUrl = result.url;

        // Supabaseにデータを挿入
        // table_nameで挿入するテーブルが指定される.指定が無い場合はomurice_images
        const insertData1 = {
            image_path: imageUrl,
            station_id: stationId,
        }
        let insertData2 = {};
        let table_name = 'omurice_images';
        if(body.table_name == "openai_info") {
            table_name = body.table_name;
            insertData2 = {
                shoutengai_index: body.shoutengai,
                michi_index: body.michi,
                furui_mise_index: body.furui_mise,
                shoku_sample_index: body.shoku_sample,
                building_index: body.building,
                chain_index: body.chain
            }
        } else {
            insertData2 = {
                station_name: body.station,
                egg: body.egg,
                rice: body.rice,
                sauce: body.sauce
            }
        }
        const { data, error } = await supabase
            .from(table_name) // Supabaseのテーブル名を指定
            .insert([
                {
                    ...insertData1,
                    ...insertData2
                }
            ]);

        if (error) {
            throw new Error('Supabaseへのデータ登録に失敗しました: ' + error.message);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'アップロードとデータ登録が成功しました',
                gyazoUrl: imageUrl,
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        };
    }
};

