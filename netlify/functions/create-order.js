const Razorpay = require('razorpay');


exports.handler = async (event, context) => {
if (event.httpMethod !== 'POST') {
return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
}


try {
const { amount, notes } = JSON.parse(event.body);


if (!amount || amount < 100) {
return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount (minimum ₹1)' }) };
}


const razorpay = new Razorpay({
key_id: process.env.RAZORPAY_KEY_ID,
key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const options = {
amount: amount,
currency: 'INR',
receipt: `receipt_${Date.now()}`,
notes: notes || {}
};


const order = await razorpay.orders.create(options);


return { statusCode: 200, body: JSON.stringify({ id: order.id, currency: order.currency, amount: order.amount }) };
} catch (error) {
console.error('Create order error:', error);
return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create order', details: error.message }) };
}
};