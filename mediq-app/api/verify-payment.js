// api/verify-payment.js
// Vercel serverless function. Env vars needed (Vercel dashboard):
//   RAZORPAY_KEY_SECRET
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (service role — bypasses RLS, server-only, never expose to the client)

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const PLAN_PRICES = {
  silver: 149,
  gold: 299,
  platinum: 499,
  diamond: 999,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    hospital_id,
    plan,
  } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !hospital_id || !plan) {
    return res.status(400).json({ success: false, error: 'Missing fields.' });
  }

  if (!PLAN_PRICES[plan]) {
    return res.status(400).json({ success: false, error: 'Unknown plan.' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // 1. Verify the signature Razorpay gave the browser is genuine —
  //    this is what actually proves the payment happened.
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Invalid payment signature.' });
  }

  // 2. Re-check the actual charged amount against the claimed plan,
  //    so a tampered client can't unlock Diamond by paying for Silver.
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const order = await orderRes.json();
    const paidRupees = (order.amount || 0) / 100;

    if (paidRupees !== PLAN_PRICES[plan]) {
      return res.status(400).json({ success: false, error: 'Paid amount does not match the selected plan.' });
    }
  } catch (err) {
    return res.status(502).json({ success: false, error: 'Could not verify payment amount with Razorpay.' });
  }

  // 3. Activate the subscription for 30 days.
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('hospitals')
    .update({
      subscription_plan: plan,
      subscription_status: 'active',
      current_period_end: currentPeriodEnd,
      approval_status: 'approved',
      last_razorpay_order_id: razorpay_order_id,
      last_razorpay_payment_id: razorpay_payment_id,
    })
    .eq('id', hospital_id);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(200).json({ success: true });
}
