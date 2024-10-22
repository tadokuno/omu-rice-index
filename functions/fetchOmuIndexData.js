// netlify/functions/fetchOmuIndexData.js
import { fetchOmuriceIndexData } from './regOmuIndex.js';

export async function handler(event, context) {
  // クエリパラメータを取得
  const params = event.queryStringParameters;
  const station_name = params.station_name;
  const station_id = params.station_id;
  const lat = params.lat;
  const lng = params.lng;

  let result = await fetchOmuriceIndexData(station_name,station_id,lat,lng); 
  if( !result ) {
    result = {
      stationName: station_name,
      station_id,
      lat,
      lng, 
      index: 0
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};

