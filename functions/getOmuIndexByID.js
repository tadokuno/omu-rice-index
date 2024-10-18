// netlify/functions/getOmuIndexByID.js
import { getOmuIndexByID } from './script.js';

export async function handler(event, context) {
  // クエリパラメータを取得
  const params = event.queryStringParameters;
  const station_id = params.station_id;

  const result = await getOmuIndexByID(station_id);  

  console.log(result);
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};

