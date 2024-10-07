import { getOmuIndexCountable } from './placesApi.js';
import { calculateOmuIndex } from './openaiApi.js';

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

function roundCount(count) {
  return Math.floor(count>20?10:count/2);
}

export async function omuIndexMain(stationName) {
  try {
    let point = 0;
    let messages='';

    const openaiPromise = calculateOmuIndex(stationName); // openai API 時間かかる

    const result = await getOmuIndexCountable(stationName); // Places API

    if( result ) {
      const localCafeIndex = roundCount(result.localCafe.count);
      const chineseRestaurantIndex = roundCount(result.chineseRestaurant.count);
      const westernRestaurantIndex = roundCount(result.westernRestaurant.count);
      const snackIndex = roundCount(result.snack.count);
      messages = `喫茶店の数: ${result.localCafe.count}件\n`;
      messages += `町中華の数: ${result.chineseRestaurant.count}件\n`;
      messages += `洋食屋の数: ${result.westernRestaurant.count}\n`;
      messages += `スナックの数: ${result.snack.count}\n`;
      point = localCafeIndex + chineseRestaurantIndex + westernRestaurantIndex + snackIndex;
    }

    const result2 = await openaiPromise;

    for (let key in result2 ) {
      const data = result2[key];
      point += data.index;
//      messages += `${key} - 得点: ${data.index}, 根拠: ${data.text}\n`;
      messages += `${data.index}: ${data.text}\n`;
    }
    messages += '\n' + result.localCafe.message + '\n';
    messages += result.chineseRestaurant.message + '\n';
    messages += result.westernRestaurant.message + '\n';
    messages += result.snack.message + '\n';
    point = point * 8/10;
    return `${stationName}のオムライス指数: ${point}/80\n\n${messages}`;
  } catch (error) {
    console.error('Error fetching Omu Index:', error);
    return "エラー";
  }
}

