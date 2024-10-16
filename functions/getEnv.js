// netlify/functions/getEnv.js
export async function handler(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      supabaseUrl: process.env.SUPABASE_API_URL,
      supabaseKey: process.env.SUPABASE_API_KEY
    }),
  };
};

