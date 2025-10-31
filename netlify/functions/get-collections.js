// netlify/functions/get-collections.js

import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// ✅ Define your exact allowed frontend  domain here
const CORS_ORIGIN = 'https://sparkly-genie-88594b.netlify.app';

export default async function handler(req, res) {
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).set({
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }).send();
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/collections?select=*&is_active=eq.true&order=sort_order.asc`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    const data = await response.json();

    return res.status(200).set({
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    }).json(data);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return res.status(500).set({
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Content-Type': 'application/json',
    }).json({ error: 'Failed to fetch collections' });
  }
}
