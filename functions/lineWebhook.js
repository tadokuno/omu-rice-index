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
      
      try {
        const result = await getOmuIndex(stationName);

	let messages='';
	let point = 0;
        if( result ) {
          messages = `${result.stationName}駅周辺500m以内にある喫茶店の数: ${result.cafeCount}件\n ${result.stationName}駅周辺500m以内にある町中華の数: ${result.chineseRestaurantCount}件\n`
	  point = (result.cafeCount + result.chineseRestaurantCount)/2;
	}

	const result2 = await calculateOmuIndex(stationName);
console.log(result2);
	for (let key in result2 ) {
	  const data = result2[key];
	  point += data.index;
	  messages += `${key} - 得点: ${data.index}, 根拠: ${data.text}\n`;
	}


	const replyMessage = {
          type: 'text',
	  text: `オムライス指数: ${point}\n${messages}`
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

