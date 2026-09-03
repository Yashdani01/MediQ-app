// Vercel serverless function — runs on Vercel's server, never in the browser.
// This is the only safe place to talk to Razorpay with your secret key.
// File location matters: this must live at /api/create-order.js in your
// GitHub repo (NOT inside /src) for Vercel to detect it automatically.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount } = req.body || {};

  // Only these four plan prices are ever valid — this stops someone
  // tampering with the request to pay ₹1 for any plan.
  const VALID_AMOUNTS = [149, 299, 499, 999];
  if (!VALID_AMOUNTS.includes(Number(amount))) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: 'Razorpay keys are not configured on the server.' });
  }

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Razorpay wants paise, not rupees
        currency: 'INR',
        receipt: `mediq_${Date.now()}`,
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: order.error?.description || 'Could not create order.' });
    }

    return res.status(200).json(order);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
