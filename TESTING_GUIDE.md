# TiketKu MVP Testing Guide

**Created:** 2025-11-15  
**Status:** Ready for Testing  
**Environment:** Development/Staging

---

## 🎯 Testing Overview

This guide provides step-by-step instructions for testing the complete TiketKu MVP implementation, including payment flow, email delivery, and order management.

---

## ⚙️ Prerequisites

### 1. Environment Setup

Create a `.env.local` file with the following variables:

```env
# Database (Development - SQLite)
DATABASE_URL="file:./prisma/db/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-character-secret-here"

# Midtrans Sandbox
MIDTRANS_SERVER_KEY="SB-Mid-server-YOUR_KEY"
MIDTRANS_CLIENT_KEY="SB-Mid-client-YOUR_KEY"
MIDTRANS_MERCHANT_ID="G000000000"
MIDTRANS_IS_PRODUCTION="false"

# Frontend Midtrans
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-YOUR_KEY"
NEXT_PUBLIC_MIDTRANS_SNAP_URL="https://app.sandbox.midtrans.com/snap/snap.js"

# Resend Email
RESEND_API_KEY="re_YOUR_API_KEY"
EMAIL_FROM="TiketKu <noreply@YOUR_DOMAIN.com>"

# Node Environment
NODE_ENV="development"
```

### 2. Get Midtrans Credentials

1. Register at https://dashboard.sandbox.midtrans.com
2. Go to Settings > Access Keys
3. Copy Server Key and Client Key
4. Copy Merchant ID from Settings > General

### 3. Get Resend API Key

1. Register at https://resend.com
2. Go to API Keys page
3. Create new API key
4. Verify your sender domain or use resend's test domain

### 4. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Optional: Seed sample data
# Create POST request to http://localhost:3000/api/setup-sample-data
```

### 5. Start Development Server

```bash
npm run dev
```

Access at: http://localhost:3000

---

## 🧪 Test Cases

### Test 1: User Registration & Email Verification

**Steps:**
1. Go to `/register`
2. Fill in registration form:
   - Name: Test User
   - Email: your-test-email@example.com
   - Password: TestPassword123!
   - Phone: 08123456789
3. Click "Daftar"
4. Check console for verification email (development mode)
5. Copy verification URL from console
6. Open verification URL in browser
7. Verify email is confirmed

**Expected Result:**
- ✅ User account created
- ✅ Verification email logged to console
- ✅ Email verification successful
- ✅ Can login with credentials

---

### Test 2: Event Creation (Admin)

**Steps:**
1. Login as admin (create admin user first or modify role in database)
2. Go to `/admin`
3. Click "Create Event"
4. Fill in event details:
   - Title: Test Music Concert
   - Description: Amazing concert
   - Venue: Stadium Utama
   - Address: Jl. Sudirman No. 1
   - Start Date: Future date
   - End Date: Future date
   - Max Capacity: 1000
5. Add ticket types:
   - VIP: Rp 500,000 (100 qty)
   - Regular: Rp 250,000 (500 qty)
6. Click "Create Event"

**Expected Result:**
- ✅ Event created successfully
- ✅ Visible on homepage
- ✅ Ticket types created

---

### Test 3: Complete Payment Flow (Midtrans Snap)

**Steps:**

#### 3.1 Browse & Select Tickets
1. Go to homepage `/`
2. Find test event
3. Click "Lihat Detail"
4. Select ticket quantity:
   - Regular: 2 tickets
5. Click "Pesan Tiket"

#### 3.2 Checkout
6. Fill checkout form:
   - Name: Test Buyer
   - Email: buyer@example.com
   - Phone: 08123456789
7. Click "Lanjutkan ke Pembayaran"

**Expected Result:**
- ✅ Order created with status PENDING
- ✅ Snap token generated
- ✅ Redirected to payment page
- ✅ Order expires in 30 minutes (countdown shown)

#### 3.3 Payment Process
8. On payment page, verify:
   - Order summary correct
   - Timer countdown working
   - "Bayar Sekarang" button visible
9. Click "Bayar Sekarang"
10. Snap payment popup opens
11. Select payment method (e.g., BCA Virtual Account)
12. Copy virtual account number

**Expected Result:**
- ✅ Snap popup loads correctly
- ✅ Payment methods displayed
- ✅ Can select payment method
- ✅ Virtual account number generated

#### 3.4 Simulate Payment (Sandbox)
13. Go to https://simulator.sandbox.midtrans.com/bca/va/index
14. Enter virtual account number
15. Click "Pay"
16. Wait for webhook processing

**Expected Result:**
- ✅ Payment successful in simulator
- ✅ Webhook received by application
- ✅ Order status updated to PAID
- ✅ Tickets generated automatically
- ✅ Confirmation email sent (check console)
- ✅ Redirected to success page

---

### Test 4: Email Notifications

**Check console output for these emails:**

#### 4.1 Order Confirmation Email
- Subject: "Pembayaran Berhasil - Order #ORDER_ID"
- Contains: Order details, event info, total amount
- Sent after successful payment

#### 4.2 Ticket Delivery Email
- Subject: "Tiket Anda - EVENT_TITLE"
- Contains: QR codes for tickets
- Sent after payment success

#### 4.3 Password Reset Email
- Subject: "Reset Password TiketKu"
- Contains: Reset link
- Sent when user requests password reset

**Expected Result:**
- ✅ All emails logged to console in dev mode
- ✅ Email templates formatted correctly
- ✅ All dynamic data populated

---

### Test 5: Order Expiry System

**Steps:**
1. Create an order but DON'T pay
2. Wait for order to expire (30 minutes) OR
3. Manually trigger cron job:
   ```bash
   curl http://localhost:3000/api/cron/expire-orders
   ```
4. Check order status in database

**Expected Result:**
- ✅ Order status changed to CANCELLED
- ✅ Ticket availability restored
- ✅ Cancellation email sent
- ✅ Event capacity decreased

---

### Test 6: Ticket Validation at Gate

**Steps:**
1. Complete a successful order (get tickets)
2. Go to `/gate`
3. Login as GATE_OPERATOR
4. Select gate entry
5. Enter ticket QR code manually
6. Click "Scan"

**Expected Result:**
- ✅ Ticket validated successfully
- ✅ Ticket status changed to USED
- ✅ Gate scan record created
- ✅ Cannot scan same ticket twice

---

### Test 7: My Tickets Page

**Steps:**
1. Go to `/my-tickets`
2. Enter email used for order
3. Click "Cari Tiket"

**Expected Result:**
- ✅ All tickets for email displayed
- ✅ QR codes visible
- ✅ Event details shown
- ✅ Download button works

---

### Test 8: Payment Failure Scenarios

#### 8.1 Expired Order
1. Create order
2. Wait 30 minutes (or run cron job)
3. Try to pay

**Expected:** Payment button disabled, message shown

#### 8.2 Payment Cancelled
1. Create order
2. Open Snap popup
3. Close popup without paying

**Expected:** Still on payment page, can retry

#### 8.3 Payment Failed
1. Create order
2. Use Midtrans sandbox to simulate failed payment
3. Check order status

**Expected:** Order remains PENDING, can retry

---

## 🔍 Verification Checklist

### Database Checks

```bash
# Check order status
npx prisma studio
# Navigate to Order table
# Verify:
# - expiresAt is set
# - midtransSnapToken exists
# - status transitions correctly
```

### API Response Checks

```bash
# Check order creation response
POST /api/orders
Response should include:
- orderId
- snapToken
- paymentUrl
- expiresAt
```

### Webhook Verification

```bash
# Check webhook logs
# Verify:
# - Signature verification successful
# - Order status updated
# - Tickets generated
# - Email sent
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Snap.js Not Loading

**Solution:**
- Check NEXT_PUBLIC_MIDTRANS_CLIENT_KEY is set
- Verify NEXT_PUBLIC_MIDTRANS_SNAP_URL is correct
- Check browser console for errors

### Issue 2: Webhook Not Received

**Solution:**
- Ensure dev server is running
- Check Midtrans dashboard webhook settings
- Use ngrok for local testing:
  ```bash
  ngrok http 3000
  ```
- Set webhook URL in Midtrans: `https://your-ngrok-url.ngrok.io/api/payments/webhook`

### Issue 3: Email Not Sending

**Solution:**
- In development, emails log to console
- Check RESEND_API_KEY is valid
- Verify EMAIL_FROM domain is verified in Resend

### Issue 4: Tickets Not Generated

**Solution:**
- Check webhook signature verification
- Verify order status is PENDING before payment
- Check database transactions completed
- Review webhook logs

### Issue 5: Order Expiry Not Working

**Solution:**
- Manually trigger: `curl http://localhost:3000/api/cron/expire-orders`
- Check expiresAt is set correctly
- Verify cron job is running (Vercel Cron in production)

---

## 📊 Performance Testing

### Load Testing (Optional)

```bash
# Install autocannon
npm install -g autocannon

# Test order creation
autocannon -c 10 -d 30 http://localhost:3000/api/orders \
  -m POST \
  -H "Content-Type: application/json" \
  -b '{"userId":"user_id","eventId":"event_id","items":[...],"totalAmount":500000}'
```

### Expected Performance:
- Order creation: < 500ms
- Snap token generation: < 1s
- Webhook processing: < 2s
- Email sending: < 3s

---

## ✅ MVP Acceptance Criteria

### Must Pass All:
- [ ] User can register and verify email
- [ ] User can browse events
- [ ] User can select tickets and checkout
- [ ] Payment popup opens with Midtrans Snap
- [ ] Can complete payment with sandbox
- [ ] Order status updates automatically
- [ ] Tickets generated after payment
- [ ] Confirmation email sent
- [ ] Can view tickets in My Tickets
- [ ] Gate can validate tickets
- [ ] Expired orders cancelled automatically
- [ ] Ticket availability managed correctly

### Production Readiness:
- [ ] All environment variables configured
- [ ] Database migrated to PostgreSQL
- [ ] Real Midtrans production keys configured
- [ ] Real email domain verified
- [ ] Cron job scheduled
- [ ] Error tracking configured
- [ ] Security headers verified

---

## 🚀 Next Steps After Testing

1. **Fix Any Issues Found**
   - Document bugs
   - Prioritize critical fixes
   - Retest after fixes

2. **Performance Optimization**
   - Add database indexes if needed
   - Optimize slow queries
   - Add caching where appropriate

3. **Security Audit**
   - Review authentication flows
   - Verify webhook signature validation
   - Check rate limiting

4. **Production Deployment**
   - Setup PostgreSQL database
   - Configure production environment variables
   - Deploy to Vercel/hosting platform
   - Configure Midtrans production webhook
   - Test on production environment

5. **Monitoring Setup**
   - Setup Sentry for error tracking
   - Configure uptime monitoring
   - Setup analytics

---

## 📞 Support & Resources

- **Midtrans Docs:** https://docs.midtrans.com
- **Midtrans Sandbox:** https://dashboard.sandbox.midtrans.com
- **Midtrans Simulator:** https://simulator.sandbox.midtrans.com
- **Resend Docs:** https://resend.com/docs
- **Project Docs:** `MVP_READINESS_PLAN.md`, `IMPLEMENTATION_PROGRESS.md`

---

**Happy Testing! 🎉**