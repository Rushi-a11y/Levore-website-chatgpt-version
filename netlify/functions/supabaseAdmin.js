import { createClient } from '@supabase/supabase-js';


const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;


export const handler = async () => {
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const { data } = await supabase.from('orders').select('*').limit(5);
return { statusCode: 200, body: JSON.stringify(data) };
};