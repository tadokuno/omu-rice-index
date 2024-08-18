import 'dotenv/config';  // .envファイルからAPIキーを読み込む
import fetch from 'node-fetch';

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

// 緯度経度から特定のタイプの店舗数を取得する関数
async function getPlaceCount(lat, lng) {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    const data = {
        includedTypes: ["cafe"],  // 検索する場所のタイプを指定
        maxResultCount: 10,
        locationRestriction: {
            circle: {
                center: {
                    latitude: lat,
                    longitude: lng
                },
                radius: 500.0  // 半径500mを指定
            }
        }
    };

    const placesUrl = `https://places.googleapis.com/v1/places:searchNearby?key=${apiKey}`;

    const response = await fetch(placesUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-FieldMask': 'places.displayName,places.primaryType,places.types'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (result.places) {
        return result.places.length;
    } else {
        throw new Error('Places API Error: ' + result.status);
    }
}

// メイン処理
(async () => {
    try {
        // 駅の緯度経度を取得
        const location = await getCoordinates(stationName);
        const lat = location.lat;
        const lng = location.lng;

        // 緯度経度から指定した範囲内の店舗数を取得
        const placeCount = await getPlaceCount(lat, lng);

        console.log(`${stationName}駅周辺500m以内にある喫茶店の数: ${placeCount}件`);
    } catch (error) {
        console.error(error);
    }
})();

