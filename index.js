import dotenv from 'dotenv';
import express from 'express';
import line from '@line/bot-sdk';

dotenv.config();

const config = {
  channelAccessToken: process.evn.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.evn.CHANNEL_SECRET
};

const app = express();

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const echo = { type: 'text', text: event.message.text };
  return client.replyMessage(event.replyToken, echo);
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

