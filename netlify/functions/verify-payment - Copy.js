const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');


exports.handler = async (event, context) => {
if (event.httpMethod !== 'POST') {
return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
}


try {
const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cart, customer, total } = JSON.parse(event.body);


const generatedSignature = crypto
.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
.update(`${razorpay_order_id}|${razorpay_payment_id}`)
.digest('hex');


if (generatedSignature !== razorpay_signature) {
return { statusCode: 400, body: JSON.stringify({ error: 'Invalid payment signature' }) };
}


const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const orderNumber = `LEVORE-${Date.now()}`;


const { data: order, error: orderError } = await supabase
.from('orders')
.insert({
order_number: orderNumber,
customer_id: customer.id,
customer_name: customer.name,
customer_email: customer.email,
customer_phone: customer.phone,
shipping_address: customer.address,
subtotal: total,
total: total,
payment_method: 'razorpay',
razorpay_order_id,
razorpay_payment_id,
razorpay_signature,
payment_status: 'paid',
order_status: 'confirmed',
paid_at: new Date().toISOString()
})
.select()
.single();


if (orderError) throw orderError;


return { statusCode: 200, body: JSON.stringify({ success: true, order }) };
} catch (error) {
console.error('Verify payment error:', error);
return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: error.message }) };
}
};