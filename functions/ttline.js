import line from '@line/bot-sdk';
import dotenv from 'dotenv';

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
      const replyMessage = {
        type: 'text',
        text: singleEvent.message.text,
      };
      await client.replyMessage(singleEvent.replyToken, replyMessage);
    }
  });

  await Promise.all(promises);

  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'success' }),
  };
}

