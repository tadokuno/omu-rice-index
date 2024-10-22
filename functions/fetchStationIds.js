import { createClient } from '@supabase/supabase-js';

export async function handler(event, context) {
  // クエリパラメータを取得
  const params = event.queryStringParameters;
  const sw_lat = params.sw_lat;
  const sw_lng = params.sw_lng;
  const ne_lat = params.ne_lat;
  const ne_lng = params.ne_lng;

  const supabaseClient = createClient(process.env.SUPABASE_API_URL, process.env.SUPABASE_API_KEY);

  const result = await fetchStationIds(supabaseClient,sw_lat,sw_lng,ne_lat,ne_lng);  

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};

async function fetchStationIds(supabaseClient,sw_lat,sw_lng,ne_lat,ne_lng) {
    // Supabaseからstation_masterテーブルの駅データを取得
    const { data, error } = await supabaseClient
        .from('station_master')
        .select('*')
        .gte('lat', sw_lat)
        .lte('lat', ne_lat)
        .gte('lng', sw_lng)
        .lte('lng', ne_lng);
    
    return data;
}
