import * as line from '@line/bot-sdk';
import dotenv from 'dotenv';
import { getOmuIndex } from './placesApi.js';
import { calculateOmuIndex } from './openaiApi.js';

dotenv.config();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

export async function handler(event, context) {
  const body = JSON.parse(event.body);

  const promises = body.events.map(async (singleEvent) => {
    if (singleEvent.type === 'message' && singleEvent.message.type === 'text') {
      const stationName = singleEvent.message.text;
//      if( !stationName.endsWith('駅') ) {
//        stationName += '駅';
//      }
      try {
        fetch('https://api.line.me/v2/bot/chat/loading/start', {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${config.channelAccessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({"chatId": singleEvent.source?.userId})
        })
      } catch {
        console.log("Loading Animation Error");
      }

      try {
        const result = await getOmuIndex(stationName);

	      let messages='';
	      let point = 0;
        if( result ) {
          messages = `${result.stationName}周辺の喫茶店の数: ${result.cafeCount}件\n${result.stationName}周辺の町中華の数: ${result.chineseRestaurantCount}件\n\n`
	        point = Math.round((result.cafeCount + result.chineseRestaurantCount)/6);
	      }

	      const result2 = await calculateOmuIndex(stationName);
console.log(result2);
	      for (let key in result2 ) {
	        const data = result2[key];
	        point += data.index;
	        messages += `${key} - 得点: ${data.index}, 根拠: ${data.text}\n`;
	      }
        messages += '\n' + result.cafeMessage + '\n';
        messages += result.chineseRestaurantMessage + '\n';
	      const replyMessage = {
          type: 'text',
	        text: `オムライス指数: ${point}\n\n${messages}`
	      };
       	await client.replyMessage(singleEvent.replyToken, replyMessage);
      } catch (error) {
        console.error('Error fetching Omu Index:', error);
        const errorMessage = {
          type: 'text',
          text: 'オムライスインデックスの取得中にエラーが発生しました。'
        };
        await client.replyMessage(singleEvent.replyToken, errorMessage);
      }
    }
  });

  await Promise.all(promises);

  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'success' }),
  };
}

