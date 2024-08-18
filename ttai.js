import {VertexAI} from '@google-cloud/vertexai';

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({project: 'dotted-cat-432309-d2', location: 'asia-northeast1'});
const model = 'gemini-1.5-flash-001';

// Instantiate the models
const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    'maxOutputTokens': 8192,
    'temperature': 1,
    'topP': 0.95,
  },
  safetySettings: [
    {
        'category': 'HARM_CATEGORY_HATE_SPEECH',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
        'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
        'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
        'category': 'HARM_CATEGORY_HARASSMENT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ],
});


const chat = generativeModel.startChat({});

async function sendMessage(message) {
  const streamResult = await chat.sendMessageStream(message);
  process.stdout.write('stream result: ' + JSON.stringify((await streamResult.response).candidates[0].content) + '\n');
}

async function generateContent() {
  await sendMessage([
    {text: `駅名を指定したときに、その駅の周辺の以下の各要素について、10点満点で得点を付けます。`}
  ]);
  await sendMessage([
    {text: `古い商店街がある
道が入り組んでいる
飲食店に限らず、古い店が生き残っている
古いショーケース、食品サンプルが飾っている店がある`}
  ]);
  await sendMessage([
    {text: `違います。駅の周辺について、以下の要素についてそれぞれ得点を付けます。
古い商店街がある
道が入り組んでいる
飲食店に限らず、古い店が生き残っている
古いショーケース、食品サンプルが飾っている店がある`}
  ]);
  await sendMessage([
    {text: `町田駅について得点を付けます。
古い商店街があるかどうかについて、10点満点で採点して`}
  ]);
  await sendMessage([
    {text: `次に、道が入り組んでいる
について10点満点で採点`}
  ]);
  await sendMessage([
    {text: `飲食店に限らず、古い店が生き残っているかどうかについて`}
  ]);
  await sendMessage([
    {text: `古いショーケース、食品サンプルが飾っている店があるかどうかについて`}
  ]);
}

generateContent();
