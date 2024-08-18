import 'dotenv/config';  // .envファイルから環境変数を読み込む
import fetch from 'node-fetch';
import readline from 'readline';
import keypress from 'keypress';

// キーボード入力を設定
keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

// キーボード入力を待つ関数
function waitForKeyPress() {
    return new Promise((resolve, reject) => {
        process.stdin.once('keypress', (ch, key) => {
            if (key && key.name === 'escape') {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                reject('エスケープキーが押されたため、処理を終了します。');
            } else {
                resolve();
            }
        });
    });
}

// コマンドライン引数から駅名を取得
const stationName = process.argv[2];

if (!stationName) {
    console.error('駅名を指定してください。');
    process.exit(1);
}

// 駅の緯度経度を取得する関数
async function getCoordinates(stationName) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(stationName)}&key=${apiKey}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    if (data.status === 'OK') {
        const location = data.results[0].geometry.location;
        return location;
    } else {
        throw new Error('Geocoding API Error: ' + data.status);
    }
}

// Nearby Search APIを使用して店舗数を取得する関数
async function getAllPlaceCount(lat, lng, tpy) {
    const apiKey = process.env.GOOGLE_API_KEY;
    let totalCount = 0;
    let nextPageToken = null;

    do {
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&type=${tpy}&key=${apiKey}${nextPageToken ? `&pagetoken=${nextPageToken}` : ''}`;

        const response = await fetch(placesUrl);
        const result = await response.json();
        
        if (result.status === 'OK') {
	    for(let store of result.results) {
		    console.log(store.name);
	    }
            totalCount += result.results.length;
            nextPageToken = result.next_page_token;
            console.log(`現在の店舗数: ${totalCount}件`);
            if (nextPageToken) {
                console.log('次のページの結果を取得するにはエンターキーを押してください。終了するにはエスケープキーを押してください。');
                try {
                    await waitForKeyPress();  // キーボード入力を待つ
                } catch (err) {
                    console.log(err);
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));  // APIに負荷をかけないように待機
            }
        } else {
            throw new Error('Places API Error: ' + result.status);
        }
    } while (nextPageToken);

    return totalCount;
}

// メイン処理
(async () => {
    try {
        // 駅の緯度経度を取得
        const location = await getCoordinates(stationName);
        const lat = location.lat;
        const lng = location.lng;

        // 緯度経度から指定した範囲内の店舗数を取得
        const placeCount = await getAllPlaceCount(lat, lng, "純喫茶");

        console.log(`${stationName}駅周辺500m以内にある喫茶店の最終的な数: ${placeCount}件`);
    } catch (error) {
        console.error(error);
    } finally {
        console.log("Done");
        process.stdin.setRawMode(false);  // stdinのrawモードを解除
        process.stdin.pause();  // stdinを閉じる
    }
})();


