import { getCoordinates,getOmuIndexCountable } from './placesApi.js';
import { calculateOmuIndex } from './openaiApi.js';
import { registerOmuriceIndex } from './regOmuIndex.js';
import { fetchOmuriceIndexData } from './regOmuIndex.js'

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

function roundCount(count) {
  return Math.floor(count>10?10:count);
}

export async function omuIndexMain(stationName) {
  try {
    let point = 0;
    let messages='';

    let result = await fetchOmuriceIndexData(stationName);
    if( result != null ) {
      return result;
    }
    const openaiPromise = calculateOmuIndex(stationName); // openai API 時間かかる

    const location = await getCoordinates(stationName);
    const lat = location.lat;
    const lng = location.lng;
    const result1 = await getOmuIndexCountable(stationName,lat,lng); // Places API

    if( result1 ) {
      const localCafeIndex = roundCount(result1.localCafe.count);
      const chineseRestaurantIndex = roundCount(result1.chineseRestaurant.count);
      const westernRestaurantIndex = roundCount(result1.westernRestaurant.count);
      const snackIndex = roundCount(result1.snack.count);
      point = localCafeIndex + chineseRestaurantIndex + westernRestaurantIndex + snackIndex;
    }

    const result2 = await openaiPromise;

    for (let key in result2 ) {
      const data = result2[key];
      point += data.index;
    }

    result = {
      index: point,
      stationName: stationName,
      lat: lat,
      lng: lng,
      googlemap: result1,
      openai: result2,
    }
    console.log(JSON.stringify(result,null, 2));

    await registerOmuriceIndex(stationName,result); // どんどん上書きしていく

    return result;
  } catch (error) {
    console.error('Error fetching Omu Index:', error);
    return "エラー";
  }
}

export function createLineMesasge(stationName,result1,result2,point) {
  let messages='';
  messages = `喫茶店の数: ${result1.localCafe.count}件\n`;
  messages += `町中華の数: ${result1.chineseRestaurant.count}件\n`;
  messages += `洋食屋の数: ${result1.westernRestaurant.count}件\n`;
  messages += `スナックの数: ${result1.snack.count}件\n`;
  for (let key in result2 ) {
    const data = result2[key];
    messages += `${data.index}: ${data.text}\n`;
  }
  messages += '\n' + result1.localCafe.message + '\n';
  messages += result1.chineseRestaurant.message + '\n';
  messages += result1.westernRestaurant.message + '\n';
  messages += result1.snack.message + '\n';
  return `${stationName}のオムライス指数: ${point}%\n\n${messages}\n${stationName}のオムライス指数: ${point}%`;
}


