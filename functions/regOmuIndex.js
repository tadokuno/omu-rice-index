import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function registerOmuriceIndex(station_name,omuIndexData) {
  try {
    // 1. station_masterテーブルからstation_nameに一致する駅情報を取得
    const { data: stationData, error: stationError } = await supabase
      .from('station_master')
      .select('station_id')
      .eq('station_name', station_name)
      .single();

    if (stationError && stationError.code !== 'PGRST116') { // 駅が存在しないエラー以外のエラーをチェック
      console.error('Error fetching station:', stationError);
      return;
    }

    let station_id;

    if (!stationData) {
      // 2. station_masterに駅が存在しない場合、omuIndexDataを使って、station_masterに新規登録

      // 新しい駅情報をstation_masterに登録
      const { data: newStation, error: insertError } = await supabase
        .from('station_master')
        .insert([
          {
            station_name: omuIndexData.stationName,
            lat: omuIndexData.lat,
            lng: omuIndexData.lng,
            created_at: new Date(),
          },
        ])
        .select();

      if (insertError) {
        console.error('Error inserting station:', insertError);
        return;
      }

      station_id = newStation[0].station_id;
    } else {
      // 3. 駅が既に存在する場合、そのIDを取得
      station_id = stationData.station_id;
    }

    // 4. omurice_indexテーブルにオムライス指数データを追加

    // OpenAIの戻り値を登録
    try { // この中が一つのトランザクションとなる
      const openaiId = await insertOpenAIInfo(
        station_id,
        omuIndexData.openai.shoutengai,
        omuIndexData.openai.michi,
        omuIndexData.openai.furuiMise,
        omuIndexData.openai.shokuSample,
        omuIndexData.openai.building,
        omuIndexData.openai.chain
      );
      const googlemapId = await insertGoogleMapInfo(
        station_id,
        omuIndexData.googlemap.localCafe,
        omuIndexData.googlemap.chineseRestaurant,
        omuIndexData.googlemap.westernRestaurant,
        omuIndexData.googlemap.snack
      );
      if (openaiId && googlemapId) {
        await insertOmuriceIndex(station_id, omuIndexData.lat, omuIndexData.lng, openaiId, googlemapId, omuIndexData.index);
        console.log('All data inserted successfully!');
      }
    } catch (error) {
      console.error('Error inserting all data:', error);
    }
  } catch (error) {
    console.error('Error in registerOmuriceIndex:', error);
  }
}

async function insertOpenAIInfo(stationId, shoutengai, michi, furuiMise, shokuSample, building, chain) {
  const { data, error } = await supabase
    .from('openai_info')
    .insert([
      {
        station_id: stationId,
        shoutengai_index: shoutengai.index,
        shoutengai_text: shoutengai.text,
        michi_index: michi.index,
        michi_text: michi.text,
        furui_mise_index: furuiMise.index,
        furui_mise_text: furuiMise.text,
        shoku_sample_index: shokuSample.index,
        shoku_sample_text: shokuSample.text,
        building_index: building.index,
        building_text: building.text,
        chain_index: chain.index,
        chain_text: chain.text
      }
    ])
    .select(); // 挿入後にidを取得

  if (error) {
    console.error('Error inserting OpenAI info:', error);
  } else {
    console.log('OpenAI info inserted:', data[0]);
    return data[0].id; // openai_infoのidを返す
  }
}

async function insertGoogleMapInfo(stationId, localCafe, chineseRestaurant, westernRestaurant, snack) {
  const { data, error } = await supabase
    .from('googlemap_info')
    .insert([
      {
        station_id: stationId,
        local_cafe_count: localCafe.count,
        local_cafe_message: localCafe.message,
        chinese_restaurant_count: chineseRestaurant.count,
        chinese_restaurant_message: chineseRestaurant.message,
        western_restaurant_count: westernRestaurant.count,
        western_restaurant_message: westernRestaurant.message,
        snack_count: snack.count,
        snack_message: snack.message
      }
    ])
    .select(); // 挿入後にidを取得

  if (error) {
    console.error('Error inserting Google Map info:', error);
  } else {
    console.log('Google Map info inserted:', data[0]);
    return data[0].id; // googlemap_infoのidを返す
  }
}

async function insertOmuriceIndex(stationId, lat, lng, openaiId, googlemapId, omuriceIndex) {
  const { data, error } = await supabase
    .from('omurice_index')
    .insert([
      {
        station_id: stationId,
        lat: lat,
        lng: lng,
        openai_id: openaiId,
        googlemap_id: googlemapId,
        index: omuriceIndex
      }
    ]);

  if (error) {
    console.error('Error inserting Omurice Index:', error);
  } else {
    console.log('Omurice Index inserted:', data);
  }
}

export async function fetchOmuriceIndexData(stationName) {
  try {
    // station_masterテーブルからstation_id、lat、lngを取得
    const { data: stationData, error: stationError } = await supabase
      .from('station_master')
      .select('station_id, station_name, lat, lng')
      .eq('station_name', stationName)
      .single();

    if (stationError) {
      console.log("Cannot found station\n");
      throw stationError;
    }

    const { station_id, lat, lng } = stationData;

    // omurice_indexテーブルから、created_atが最大のデータを取得
    const { data: omuriceIndexData, error: omuriceIndexError } = await supabase
      .from('omurice_index')
      .select('index, googlemap_id, openai_id')
      .eq('station_id', station_id)
      .order('created_at', { ascending: false })  // created_atで降順に並べて、最新を取得
      .limit(1)
      .single();

    if (omuriceIndexError) throw omuriceIndexError;

    const { index, googlemap_id, openai_id } = omuriceIndexData;

    // googlemap_infoテーブルからデータを取得
    const { data: googlemapData, error: googlemapError } = await supabase
      .from('googlemap_info')
      .select('local_cafe_count, local_cafe_message, chinese_restaurant_count, chinese_restaurant_message, western_restaurant_count, western_restaurant_message, snack_count, snack_message')
      .eq('id', googlemap_id)
      .single();

    if (googlemapError) throw googlemapError;

    // openai_infoテーブルからデータを取得
    const { data: openaiData, error: openaiError } = await supabase
      .from('openai_info')
      .select('*')
      .eq('id', openai_id)
      .single();

    if (openaiError) throw openaiError;

    // JSONを再構成
    const result = {
      index,
      stationName: stationName,
      lat,
      lng,
      googlemap: {
        localCafe: {
          count: googlemapData.local_cafe_count,
          message: googlemapData.local_cafe_message
        },
        chineseRestaurant: {
          count: googlemapData.chinese_restaurant_count,
          message: googlemapData.chinese_restaurant_message
        },
        westernRestaurant: {
          count: googlemapData.western_restaurant_count,
          message: googlemapData.western_restaurant_message
        },
        snack: {
          count: googlemapData.snack_count,
          message: googlemapData.snack_message
        }
      },
      openai: {
        shoutengai: {
          index: openaiData.shoutengai_index,
          text: openaiData.shoutengai_text
        },
        michi: {
          index: openaiData.michi_index,
          text: openaiData.michi_text
        },
        furuiMise: {
          index: openaiData.furui_mise_index,
          text: openaiData.furui_mise_text
        },
        shokuSample: {
          index: openaiData.shoku_sample_index,
          text: openaiData.shoku_sample_text
        },
        building: {
          index: openaiData.building_index,
          text: openaiData.building_text
        },
        chain: {
          index: openaiData.chain_index,
          text: openaiData.chain_text
        }
      }
    };

    return result;

  } catch (error) {
    // console.error('Error fetching omurice index data:', error);
    return null;
  }
}
