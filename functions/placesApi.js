import * as line from '@line/bot-sdk';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// 駅の緯度経度を取得する関数
async function getCoordinates(stationName) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(stationName)}&key=${apiKey}`;
console.log(geocodeUrl);    
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
        const requestBody = {
            locationRestriction: {
		circle: {
		    center: {
			latitude: lat,
			longitude: lng
		    },
            	    radius: 500  // 500m以内
		}
	    },
            includedTypes: [`${tpy}`],  // 喫茶店,町中華
	    languageCode: "ja"
//            pagetoken: nextPageToken || null
        };

        const placesUrl = 'https://places.googleapis.com/v1/places:searchNearby';

	let response;
	try {
            response = await fetch(placesUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
		    'X-Goog-Api-Key': `${apiKey}`,
		    'X-Goog-FieldMask': 'places.displayName'
                },
                body: JSON.stringify(requestBody)
            });
	} catch (error) {
		console.log(error);
		throw new Error('Nearby Search Error');
	}
        const result = await response.json();
//        if (result.status === 'OK') {
	    for(let place of result.places) {
		console.log(place.displayName.text);
	    }
            totalCount += result.places.length;
            nextPageToken = result.next_page_token;

            console.log(`現在の店舗数: ${totalCount}件`);
            if (nextPageToken) {
                await new Promise(resolve => setTimeout(resolve, 2000));  // APIに負荷をかけないように待機
            }
//        }
//	else {
//            throw new Error('Places API Error: ' + result.status);
//        }
    } while (nextPageToken);

    return totalCount;
}

//
//
//
export async function getOmuIndex (stationName) {
    try {
        // 駅の緯度経度を取得
        const location = await getCoordinates(stationName);
        const lat = location.lat;
        const lng = location.lng;

        // 緯度経度から指定した範囲内の店舗数を取得
        const cafeCount = await getAllPlaceCount(lat, lng, "cafe");
        const chineseRestaurantCount = await getAllPlaceCount(lat, lng, "chinese_restaurant");

        // ここでオムライスインデックスの計算を行う
        const omuIndex = calculateOmuIndex(cafeCount, chineseRestaurantCount);

        // 結果をオブジェクトとして返す
        return {
            stationName: stationName,
            cafeCount: cafeCount,
            chineseRestaurantCount: chineseRestaurantCount,
            omuIndex: omuIndex
        };
    } catch (error) {
        console.error(error);
        return null;
    } finally {
    }
};

// オムライスインデックスを計算する関数
const calculateOmuIndex = (cafeCount, chineseRestaurantCount) => {
    // 任意のロジックをここに記述
    // 例えば、喫茶店と町中華の数を合算して返す
    return cafeCount + chineseRestaurantCount;
};

// 関数の呼び出し例
//getOmuIndex("Shibuya").then(result => {
//    if (result) {
//        console.log(`${result.stationName}駅周辺500m以内にある喫茶店の数: ${result.cafeCount}件`);
//        console.log(`${result.stationName}駅周辺500m以内にある町中華の数: ${result.chineseRestaurantCount}件`);
//        console.log(`${result.stationName}駅のオムライスインデックス: ${result.omuIndex}`);
//    }
//});

