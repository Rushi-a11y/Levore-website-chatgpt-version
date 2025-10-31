const { createClient } = require('@supabase/supabase-js');


async function getShiprocketToken() {
const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
email: process.env.SHIPROCKET_EMAIL,
password: process.env.SHIPROCKET_PASSWORD
})
});
const data = await res.json();
return data.token;
}


exports.handler = async (event) => {
if (event.httpMethod !== 'POST') {
return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
}


try {
const { orderId } = JSON.parse(event.body);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);


const { data: order } = await supabase
.from('orders')
.select('*')
.eq('id', orderId)
.single();


const token = await getShiprocketToken();


const shipment = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
body: JSON.stringify({
order_id: order.order_number,
order_date: new Date(order.created_at).toISOString().split('T')[0],
pickup_location: 'Primary',
billing_customer_name: order.customer_name,
billing_phone: order.customer_phone,
billing_address: order.shipping_address,
billing_city: 'Hyderabad',
billing_state: 'Telangana',
billing_country: 'India',
billing_pincode: '500001',
order_items: [ { name: 'Chocolate Box', sku: 'SKU001', units: 1, selling_price: order.total } ],
payment_method: 'Prepaid',
sub_total: order.total,
length: 20,
breadth: 15,
height: 10,
weight: 0.5
})
});


const data = await shipment.json();
return { statusCode: 200, body: JSON.stringify({ success: true, data }) };
} catch (error) {
return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
}
};