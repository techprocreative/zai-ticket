# TiketKu MVP Readiness Plan
## Comprehensive Implementation Roadmap

**Project:** TiketKu - Ticket Management System  
**Framework:** Next.js 15 + TypeScript  
**Database:** SQLite (Dev) → PostgreSQL (Production)  
**Created:** 2025-11-15  
**Status:** Planning Phase

---

## 📋 Executive Summary

TiketKu is a feature-rich ticket management system with a solid foundation. The database schema, authentication system, event management, ticket generation, and gate entry validation are fully functional. However, critical production dependencies including payment gateway integration, email service, and database migration remain incomplete.

**Current State:**
- ✅ **Fully Implemented:** Database schema, authentication (NextAuth.js), event CRUD, ticket generation with QR codes, order management, gate entry validation, admin dashboard, hero slider
- ⚠️ **Partially Implemented:** Payment gateway (schema exists, no Midtrans integration), email service (console logs only), QR scanner (manual entry only), staff portal (UI only)
- ❌ **Not Implemented:** File upload, analytics dashboard, settings management, order expiry enforcement, refunds, push notifications, production email, rate limit verification

**MVP Goal:** Launch a production-ready ticket management system with core transactional capabilities within 4-6 weeks.

---

## 🎯 1. MVP Definition & Scope

### 1.1 Essential Features (MUST HAVE)
Features required for initial launch:

1. **Payment Processing**
   - Midtrans Snap integration for secure payments
   - Virtual account generation (BCA, Mandiri, BRI)
   - Payment status webhook handling
   - Automatic ticket generation on payment success

2. **Email Communications**
   - Order confirmation emails with ticket attachments
   - Payment reminders
   - Email verification (already implemented, needs production service)
   - Password reset emails (already implemented, needs production service)

3. **Order Management**
   - Automated order expiry (15-30 minutes)
   - Order status tracking
   - Payment deadline enforcement

4. **Production Infrastructure**
   - PostgreSQL database migration
   - Environment configuration management
   - Error monitoring and logging
   - Basic security hardening

5. **Core User Flows**
   - Event browsing and selection
   - Ticket purchase with real payment
   - Ticket delivery via email
   - Gate entry validation with QR code

### 1.2 Recommended Features (SHOULD HAVE)
Features that significantly improve UX but aren't blockers:

1. **File Upload System**
   - Event image uploads
   - Profile pictures
   - Integration with cloud storage (AWS S3/Cloudinary)

2. **Camera QR Scanner**
   - Browser-based camera scanning
   - Fallback to manual entry (already implemented)
   - Real-time validation feedback

3. **Basic Analytics**
   - Sales dashboard
   - Ticket scan statistics
   - Revenue reporting
   - Event performance metrics

4. **Email Notifications**
   - Event reminders (24h before)
   - Gate entry confirmations
   - Order status updates

5. **Error Handling Improvements**
   - User-friendly error messages
   - Retry mechanisms for failed payments
   - Better validation feedback

### 1.3 Post-MVP Features (CAN DEFER)
Features to implement after successful launch:

1. **Advanced Features**
   - Refund management system
   - Seat selection for venues
   - Early bird pricing tiers
   - Promo code system
   - Affiliate/reseller portal

2. **User Management**
   - Admin user management UI (API exists at [`src/app/api/admin/users/route.ts`](src/app/api/admin/users/route.ts))
   - Role-based access control refinement
   - User activity logs
   - Bulk user operations

3. **Reporting & Analytics**
   - Comprehensive reporting dashboard
   - Export functionality (PDF, Excel)
   - Custom report builder
   - Real-time analytics

4. **System Enhancements**
   - Push notifications (web & mobile)
   - SMS notifications
   - Multi-language support (i18n ready, needs translation)
   - Mobile app development
   - Advanced rate limiting with Redis

---

## 🚨 2. Critical Path Items (MUST-HAVE for MVP)

### 2.1 Payment Gateway Integration (Midtrans)

**Status:** ❌ Not Implemented  
**Priority:** 🔴 CRITICAL  
**Complexity:** HIGH  
**Estimated Time:** 5-7 days

#### Technical Requirements

**Files to Create:**
1. [`src/lib/midtrans.ts`](src/lib/midtrans.ts) - Midtrans SDK wrapper
2. [`src/app/api/payments/create-snap/route.ts`](src/app/api/payments/create-snap/route.ts) - Snap token generation
3. [`src/app/api/payments/webhook/route.ts`](src/app/api/payments/webhook/route.ts) - Payment notification handler
4. [`src/app/api/orders/[id]/check-status/route.ts`](src/app/api/orders/[id]/check-status/route.ts) - Payment status check

**Files to Modify:**
1. [`src/app/api/orders/route.ts`](src/app/api/orders/route.ts) - Add Midtrans Snap token generation
2. [`src/app/payment/[id]/page.tsx`](src/app/payment/[id]/page.tsx) - Integrate Snap.js popup
3. [`prisma/schema.prisma`](prisma/schema.prisma) - Already has Midtrans fields ✅
4. [`src/lib/env.ts`](src/lib/env.ts) - Add Midtrans environment variables

**Environment Variables Needed:**
```env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_MERCHANT_ID=G123456789
```

#### Implementation Steps

1. **Setup Midtrans SDK** (Day 1)
   ```typescript
   // src/lib/midtrans.ts
   import midtransClient from 'midtrans-client'
   
   const snap = new midtransClient.Snap({
     isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
     serverKey: process.env.MIDTRANS_SERVER_KEY,
     clientKey: process.env.MIDTRANS_CLIENT_KEY
   })
   ```

2. **Create Snap Token API** (Day 2)
   - Generate Snap token when order is created
   - Store token in [`Order.midtransSnapToken`](prisma/schema.prisma:119)
   - Return token to frontend

3. **Integrate Snap.js** (Day 3)
   - Load Snap.js in [`src/app/payment/[id]/page.tsx`](src/app/payment/[id]/page.tsx)
   - Replace mock payment UI with Snap popup
   - Handle payment success/failure callbacks

4. **Implement Webhook Handler** (Day 4-5)
   - Create webhook endpoint at [`/api/payments/webhook`](src/app/api/payments/webhook/route.ts)
   - Verify Midtrans signature
   - Update order status based on notification
   - Trigger ticket generation on success
   - Send confirmation email

5. **Testing** (Day 6-7)
   - Test with Midtrans sandbox
   - Test all payment methods (VA, credit card, e-wallet)
   - Test webhook scenarios (success, pending, failed, expired)
   - Test idempotency for duplicate webhooks

#### Dependencies
- `midtrans-client` npm package
- Valid Midtrans merchant account (sandbox for testing)

#### Testing Requirements
- [ ] Successful payment generates tickets
- [ ] Failed payment updates order to CANCELLED
- [ ] Pending payment shows waiting status
- [ ] Expired payment updates order status
- [ ] Webhook signature validation works
- [ ] Duplicate webhooks handled gracefully
- [ ] All payment methods tested (BCA, Mandiri, BRI, etc.)

---

### 2.2 Production Email Service Setup

**Status:** ⚠️ Partially Implemented (Console logs only)  
**Priority:** 🔴 CRITICAL  
**Complexity:** MEDIUM  
**Estimated Time:** 2-3 days

#### Technical Requirements

**Files to Modify:**
1. [`src/lib/email.ts`](src/lib/email.ts) - Implement real email service
2. [`src/lib/env.ts`](src/lib/env.ts) - Already has RESEND_API_KEY ✅

**Current Implementation:**
- Email service logs to console in development
- Templates exist for verification and password reset
- Throws error in production mode

#### Implementation Steps

1. **Choose Email Service** (Day 1 - Morning)
   - **Recommended:** Resend (already in env schema)
   - Alternatives: SendGrid, AWS SES, Mailgun
   - Register account and obtain API key

2. **Implement Resend Integration** (Day 1 - Afternoon)
   ```typescript
   // src/lib/email.ts
   import { Resend } from 'resend'
   
   const resend = new Resend(process.env.RESEND_API_KEY)
   
   export async function sendEmail({ to, subject, template, data }) {
     const body = templates[template]
     
     if (process.env.NODE_ENV === 'development') {
       console.log('=== EMAIL SENT ===', { to, subject, body })
       return { success: true }
     }
     
     const result = await resend.emails.send({
       from: process.env.EMAIL_FROM || 'TiketKu <noreply@tiketku.com>',
       to,
       subject,
       text: body,
       html: generateEmailHTML(template, data)
     })
     
     return result
   }
   ```

3. **Create Email Templates** (Day 2)
   - Create professional HTML email templates
   - Order confirmation with ticket QR codes
   - Payment reminder template
   - Event reminder template
   - Enhance existing verification/reset templates

4. **Integrate with Order Flow** (Day 2)
   - Send confirmation email in webhook handler
   - Attach ticket PDF/images
   - Send payment reminders for pending orders

5. **Testing** (Day 3)
   - Test all email templates
   - Verify deliverability
   - Check spam scores
   - Test with multiple email providers (Gmail, Outlook, etc.)

#### Environment Variables Needed:
```env
RESEND_API_KEY=re_xxx
EMAIL_FROM=TiketKu <noreply@tiketku.com>
```

#### Testing Requirements
- [ ] Verification emails delivered successfully
- [ ] Password reset emails work
- [ ] Order confirmation emails sent on payment success
- [ ] Tickets attached to confirmation emails
- [ ] Email templates render correctly in all clients
- [ ] Links in emails work correctly
- [ ] Unsubscribe functionality works (if required)

---

### 2.3 Database Migration to PostgreSQL

**Status:** ❌ Using SQLite (Development only)  
**Priority:** 🔴 CRITICAL  
**Complexity:** MEDIUM  
**Estimated Time:** 2-3 days

#### Technical Requirements

**Files to Modify:**
1. [`prisma/schema.prisma`](prisma/schema.prisma:11-14) - Change datasource to PostgreSQL
2. [`src/lib/env.ts`](src/lib/env.ts:5) - Already has DATABASE_URL ✅
3. `.env.production` - Add PostgreSQL connection string

**Current Implementation:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

#### Implementation Steps

1. **Setup PostgreSQL** (Day 1)
   - **Option A:** Use managed service (Supabase, Neon, Railway, Render)
   - **Option B:** Self-hosted PostgreSQL server
   - **Recommended:** Supabase (free tier available, includes file storage)

2. **Update Prisma Schema** (Day 1)
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Schema Adjustments** (Day 1-2)
   - Review SQLite-specific features
   - Test data type compatibility
   - Update indexes if needed
   - Handle CUID vs UUID considerations

4. **Create Production Migration** (Day 2)
   ```bash
   # Generate migration
   npx prisma migrate dev --name init_postgres
   
   # Apply to production
   npx prisma migrate deploy
   ```

5. **Data Migration (if needed)** (Day 2-3)
   - Export SQLite data if needed
   - Import to PostgreSQL
   - Verify data integrity
   - Create backup strategy

6. **Connection Pooling** (Day 3)
   - Configure Prisma connection pooling
   - Set appropriate pool size
   - Test under load

#### Environment Variables Needed:
```env
# Production
DATABASE_URL=postgresql://user:password@host:5432/tiketku?schema=public&connection_limit=5

# Optional: Direct connection for migrations
DIRECT_URL=postgresql://user:password@host:5432/tiketku?schema=public
```

#### Testing Requirements
- [ ] All queries work with PostgreSQL
- [ ] Migrations run successfully
- [ ] Data integrity maintained
- [ ] Performance acceptable
- [ ] Connection pooling works
- [ ] Backup and restore tested
- [ ] Prisma Studio works with PostgreSQL

---

### 2.4 Environment Configuration & Security

**Status:** ⚠️ Partially Complete  
**Priority:** 🔴 CRITICAL  
**Complexity:** LOW-MEDIUM  
**Estimated Time:** 1-2 days

#### Technical Requirements

**Files to Create:**
1. `.env.example` - Template for environment variables
2. `.env.production` - Production environment variables (not committed)
3. [`src/lib/config.ts`](src/lib/config.ts) - Centralized configuration

**Files to Modify:**
1. [`src/lib/env.ts`](src/lib/env.ts) - Add missing variables
2. [`next.config.ts`](next.config.ts) - Production optimizations

#### Implementation Steps

1. **Create Environment Templates** (Day 1 - Morning)
   ```env
   # .env.example
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/tiketku"
   
   # NextAuth
   NEXTAUTH_URL="https://tiketku.com"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   
   # Midtrans
   MIDTRANS_SERVER_KEY="SB-Mid-server-xxx"
   MIDTRANS_CLIENT_KEY="SB-Mid-client-xxx"
   MIDTRANS_IS_PRODUCTION="false"
   
   # Email
   RESEND_API_KEY="re_xxx"
   EMAIL_FROM="TiketKu <noreply@tiketku.com>"
   
   # Optional: Redis (for production rate limiting)
   REDIS_URL="redis://localhost:6379"
   ```

2. **Enhance Environment Validation** (Day 1 - Afternoon)
   ```typescript
   // src/lib/env.ts
   const envSchema = z.object({
     // Add all required variables
     MIDTRANS_SERVER_KEY: z.string().min(1),
     MIDTRANS_CLIENT_KEY: z.string().min(1),
     MIDTRANS_IS_PRODUCTION: z.enum(['true', 'false']).default('false'),
     RESEND_API_KEY: z.string().min(1),
     // ... etc
   })
   ```

3. **Security Headers** (Day 1)
   ```typescript
   // next.config.ts
   const nextConfig = {
     async headers() {
       return [{
         source: '/:path*',
         headers: [
           { key: 'X-Frame-Options', value: 'DENY' },
           { key: 'X-Content-Type-Options', value: 'nosniff' },
           { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
           { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
         ]
       }]
     }
   }
   ```

4. **Logging Configuration** (Day 2)
   - Enhance [`src/lib/logger.ts`](src/lib/logger.ts)
   - Add structured logging
   - Configure log levels per environment
   - Setup error tracking (Sentry integration)

5. **Generate Secrets** (Day 2)
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   ```

#### Testing Requirements
- [ ] All required environment variables validated on startup
- [ ] Application fails gracefully with missing variables
- [ ] Security headers present in all responses
- [ ] Secrets properly generated and stored
- [ ] No sensitive data in logs (production)
- [ ] Error tracking configured and tested

---

### 2.5 Order Expiry Enforcement

**Status:** ⚠️ Schema exists but not enforced  
**Priority:** 🟡 HIGH  
**Complexity:** MEDIUM  
**Estimated Time:** 2-3 days

#### Technical Requirements

**Files to Create:**
1. [`src/lib/cron/order-expiry.ts`](src/lib/cron/order-expiry.ts) - Cron job for order expiry
2. [`src/app/api/cron/expire-orders/route.ts`](src/app/api/cron/expire-orders/route.ts) - API endpoint for cron

**Files to Modify:**
1. [`src/app/api/orders/route.ts`](src/app/api/orders/route.ts) - Set expiresAt on order creation
2. [`src/app/payment/[id]/page.tsx`](src/app/payment/[id]/page.tsx) - Already has countdown timer ✅

**Current Implementation:**
- Order schema has [`expiresAt`](prisma/schema.prisma:122) field
- Payment page has countdown timer (hardcoded 15 minutes)
- No automatic order cancellation

#### Implementation Steps

1. **Set Order Expiry on Creation** (Day 1)
   ```typescript
   // src/app/api/orders/route.ts
   const order = await db.order.create({
     data: {
       // ... existing fields
       expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
     }
   })
   ```

2. **Create Expiry Cron Job** (Day 1-2)
   ```typescript
   // src/lib/cron/order-expiry.ts
   export async function expireOrders() {
     const expiredOrders = await db.order.findMany({
       where: {
         status: 'PENDING',
         expiresAt: { lt: new Date() }
       },
       include: { items: { include: { ticketType: true } } }
     })
     
     for (const order of expiredOrders) {
       // Cancel order
       await db.order.update({
         where: { id: order.id },
         data: { status: 'CANCELLED' }
       })
       
       // Restore ticket availability
       for (const item of order.items) {
         await db.ticketType.update({
           where: { id: item.ticketTypeId },
           data: { soldQuantity: { decrement: item.quantity } }
         })
       }
       
       // Send cancellation email (optional)
     }
   }
   ```

3. **Setup Cron Endpoint** (Day 2)
   - Create API route for cron job
   - Add authentication (API key)
   - Configure Vercel Cron or external cron service

4. **Client-Side Countdown** (Day 2-3)
   - Update [`src/app/payment/[id]/page.tsx`](src/app/payment/[id]/page.tsx)
   - Fetch actual expiresAt from order
   - Show remaining time
   - Auto-redirect on expiry

5. **Testing** (Day 3)
   - Test order expiry after timeout
   - Verify ticket availability restored
   - Test concurrent order expiry
   - Test edge cases (payment during expiry)

#### Cron Configuration
```yaml
# vercel.json
{
  "crons": [{
    "path": "/api/cron/expire-orders",
    "schedule": "*/5 * * * *"
  }]
}
```

#### Testing Requirements
- [ ] Orders expire after configured timeout
- [ ] Ticket availability restored on expiry
- [ ] User notified of expiration (optional)
- [ ] Cron job runs reliably
- [ ] No race conditions with payment confirmation
- [ ] Expired orders can't be paid

---

### 2.6 Deployment Preparation

**Status:** ❌ Not Configured  
**Priority:** 🟡 HIGH  
**Complexity:** MEDIUM  
**Estimated Time:** 2-3 days

#### Technical Requirements

**Files to Create:**
1. `vercel.json` - Vercel deployment configuration
2. `Dockerfile` - Docker container (if self-hosting)
3. `.dockerignore` - Already exists ✅
4. `deploy.sh` - Deployment script

**Files to Modify:**
1. [`package.json`](package.json:7-8) - Build and start scripts already configured ✅
2. [`next.config.ts`](next.config.ts) - Production optimizations

#### Implementation Steps

1. **Choose Hosting Platform** (Day 1 - Morning)
   - **Option A:** Vercel (recommended for Next.js)
   - **Option B:** Self-hosted with Docker
   - **Option C:** AWS/GCP/Azure

2. **Vercel Deployment** (Day 1)
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "framework": "nextjs",
     "regions": ["sin1"],
     "env": {
       "DATABASE_URL": "@database-url",
       "NEXTAUTH_SECRET": "@nextauth-secret"
     }
   }
   ```

3. **Database Hosting** (Day 1)
   - Setup PostgreSQL on chosen platform
   - Configure connection pooling
   - Setup automated backups
   - Test connection from deployment

4. **Environment Variables** (Day 2)
   - Add all variables to hosting platform
   - Test variable access
   - Verify secrets are encrypted

5. **CI/CD Pipeline** (Day 2)
   - Setup GitHub Actions (optional)
   - Automated testing on PR
   - Automated deployment on merge

6. **Domain & SSL** (Day 3)
   - Configure custom domain
   - Setup SSL certificates
   - Configure DNS records

7. **Monitoring Setup** (Day 3)
   - Setup error tracking (Sentry)
   - Configure uptime monitoring
   - Setup alerts for critical errors

#### Testing Requirements
- [ ] Application builds successfully
- [ ] Database migrations run on deploy
- [ ] All environment variables accessible
- [ ] Static assets served correctly
- [ ] API routes respond correctly
- [ ] WebSocket connections work (for real-time features)
- [ ] Domain and SSL configured
- [ ] Error tracking capturing errors

---

## 📈 3. Recommended MVP Items (SHOULD-HAVE)

### 3.1 File Upload for Event Images

**Status:** ❌ Not Implemented  
**Priority:** 🟢 MEDIUM  
**Complexity:** MEDIUM  
**Estimated Time:** 2-3 days

#### Technical Requirements

**Files to Create:**
1. [`src/lib/storage.ts`](src/lib/storage.ts) - Storage service wrapper
2. [`src/app/api/upload/route.ts`](src/app/api/upload/route.ts) - File upload endpoint

**Files to Modify:**
1. [`src/app/admin/page.tsx`](src/app/admin/page.tsx) - Add image upload to event form
2. [`prisma/schema.prisma`](prisma/schema.prisma:77) - imageUrl field already exists ✅

#### Implementation Options

**Option A: Cloud Storage (Recommended)**
- Cloudinary: Free tier, image optimization included
- AWS S3: Scalable, pay per use
- Vercel Blob Storage: Integrated with Vercel

**Option B: Local Storage**
- Store in public directory
- Not recommended for production
- No CDN benefits

#### Implementation Steps

1. **Setup Storage Service** (Day 1)
   ```typescript
   // src/lib/storage.ts
   import { v2 as cloudinary } from 'cloudinary'
   
   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET
   })
   
   export async function uploadImage(file: File): Promise<string> {
     const bytes = await file.arrayBuffer()
     const buffer = Buffer.from(bytes)
     
     const result = await new Promise((resolve, reject) => {
       cloudinary.uploader.upload_stream(
         { folder: 'tiketku/events' },
         (error, result) => {
           if (error) reject(error)
           else resolve(result)
         }
       ).end(buffer)
     })
     
     return result.secure_url
   }
   ```

2. **Create Upload API** (Day 1-2)
   - Validate file type and size
   - Upload to storage service
   - Return public URL
   - Handle errors

3. **Add Upload UI** (Day 2)
   - Add file input to event creation form
   - Show image preview
   - Handle upload progress
   - Display uploaded image URL

4. **Testing** (Day 3)
   - Test various image formats
   - Test file size limits
   - Test error handling
   - Verify images load on event pages

#### Environment Variables Needed:
```env
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

#### Testing Requirements
- [ ] Images upload successfully
- [ ] File type validation works
- [ ] File size limits enforced
- [ ] Images display correctly on event pages
- [ ] Error messages clear and helpful
- [ ] Upload progress shown to user

---

### 3.2 Camera QR Scanner

**Status:** ⚠️ Manual entry only  
**Priority:** 🟢 MEDIUM  
**Complexity:** MEDIUM  
**Estimated Time:** 2-3 days

#### Technical Requirements

**Files to Create:**
1. [`src/components/qr-scanner.tsx`](src/components/qr-scanner.tsx) - QR scanner component

**Files to Modify:**
1. [`src/app/gate/page.tsx`](src/app/gate/page.tsx) - Add camera scanner option

**Current Implementation:**
- Manual QR code entry works
- Scan validation functional
- Real-time updates via WebSocket

#### Implementation Steps

1. **Choose QR Library** (Day 1 - Morning)
   - **Recommended:** `@zxing/library` or `html5-qrcode`
   - Both support browser camera access

2. **Create Scanner Component** (Day 1)
   ```typescript
   // src/components/qr-scanner.tsx
   'use client'
   import { Html5QrcodeScanner } from 'html5-qrcode'
   import { useEffect, useRef } from 'react'
   
   export function QRScanner({ onScan }: { onScan: (code: string) => void }) {
     const scannerRef = useRef<Html5QrcodeScanner | null>(null)
     
     useEffect(() => {
       const scanner = new Html5QrcodeScanner(
         'qr-reader',
         { fps: 10, qrbox: { width: 250, height: 250 } },
         false
       )
       
       scanner.render(
         (decodedText) => onScan(decodedText),
         (error) => console.warn(error)
       )
       
       scannerRef.current = scanner
       return () => scanner.clear()
     }, [onScan])
     
     return <div id="qr-reader" />
   }
   ```

3. **Integrate with Gate Page** (Day 2)
   - Add toggle between manual/camera mode
   - Request camera permissions
   - Handle scan results
   - Maintain manual entry fallback

4. **Testing** (Day 2-3)
   - Test on various devices
   - Test with different QR codes
   - Test in low light conditions
   - Test permission denial handling

#### Dependencies
- `html5-qrcode` npm package

#### Testing Requirements
- [ ] Camera access works on mobile
- [ ] Camera access works on desktop
- [ ] QR codes scanned accurately
- [ ] Fallback to manual entry works
- [ ] Permission errors handled gracefully
- [ ] Works in various lighting conditions

---

### 3.3 Basic Analytics Dashboard

**Status:** ❌ Not Implemented  
**Priority:** 🟢 MEDIUM  
**Complexity:** MEDIUM  
**Estimated Time:** 3-4 days

#### Technical Requirements

**Files to Create:**
1. [`src/app/admin/analytics/page.tsx`](src/app/admin/analytics/page.tsx) - Analytics dashboard
2. [`src/app/api/analytics/route.ts`](src/app/api/analytics/route.ts) - Analytics API

**Dependencies:**
- `recharts` - Already installed ✅

#### Implementation Steps

1. **Design Analytics Queries** (Day 1)
   ```typescript
   // Key metrics to track:
   - Total revenue
   - Tickets sold by event
   - Orders by status
   - Daily/weekly sales trends
   - Top-selling events
   - Gate scan statistics
   ```

2. **Create Analytics API** (Day 1-2)
   ```typescript
   // src/app/api/analytics/route.ts
   export async function GET() {
     const [revenue, ticketsSold, orderStats, scanStats] = await Promise.all([
       db.order.aggregate({
         where: { status: 'PAID' },
         _sum: { totalAmount: true }
       }),
       db.ticket.count({ where: { status: 'ACTIVE' } }),
       db.order.groupBy({
         by: ['status'],
         _count: true
       }),
       db.gateScan.groupBy({
         by: ['isValid'],
         _count: true
       })
     ])
     
     return { revenue, ticketsSold, orderStats, scanStats }
   }
   ```

3. **Build Dashboard UI** (Day 2-3)
   - Revenue cards
   - Sales trend chart (line chart)
   - Order status distribution (pie chart)
   - Top events table
   - Scan statistics

4. **Add Date Filtering** (Day 3-4)
   - Date range picker
   - Filter analytics by date
   - Compare periods

5. **Testing** (Day 4)
   - Verify calculations accurate
   - Test with large datasets
   - Test date filtering

#### Testing Requirements
- [ ] Metrics calculate correctly
- [ ] Charts render properly
- [ ] Date filtering works
- [ ] Performance acceptable with large data
- [ ] Export functionality works (optional)

---

### 3.4 Email Notifications Enhancement

**Status:** ⚠️ Basic emails only  
**Priority:** 🟢 MEDIUM  
**Complexity:** LOW-MEDIUM  
**Estimated Time:** 2 days

#### Technical Requirements

**Files to Modify:**
1. [`src/lib/email.ts`](src/lib/email.ts) - Add new email templates

**Files to Create:**
1. [`src/lib/cron/send-reminders.ts`](src/lib/cron/send-reminders.ts) - Event reminder cron

#### Additional Email Types

1. **Order Status Updates**
   - Payment pending reminder (after 10 minutes)
   - Payment expired notification
   - Order cancelled notification

2. **Event Reminders**
   - 24 hours before event
   - 1 hour before event (optional)

3. **Gate Entry**
   - Ticket scanned confirmation
   - Multiple scan attempt alert

#### Implementation Steps

1. **Add New Templates** (Day 1)
   ```typescript
   // src/lib/email.ts
   const templates = {
     // ... existing templates
     'payment-reminder': `...`,
     'event-reminder-24h': `...`,
     'ticket-scanned': `...`,
     'order-cancelled': `...`
   }
   ```

2. **Create Reminder Cron** (Day 1-2)
   - Find events starting in 24 hours
   - Find orders with tickets for those events
   - Send reminder emails
   - Mark reminders as sent

3. **Integrate with Flows** (Day 2)
   - Send payment reminder after 10 minutes
   - Send cancellation email on order expiry
   - Send scan confirmation (optional)

#### Testing Requirements
- [ ] All email templates render correctly
- [ ] Reminders sent at correct times
- [ ] No duplicate reminders sent
- [ ] Unsubscribe mechanism works
- [ ] Email delivery tracked

---

### 3.5 Error Handling Improvements

**Status:** ⚠️ Basic error handling  
**Priority:** 🟢 MEDIUM  
**Complexity:** LOW-MEDIUM  
**Estimated Time:** 2-3 days

#### Technical Requirements

**Files to Create:**
1. [`src/app/error.tsx`](src/app/error.tsx) - Global error boundary
2. [`src/components/error-boundary.tsx`](src/components/error-boundary.tsx) - Reusable error boundary
3. [`src/lib/error-handler.ts`](src/lib/error-handler.ts) - Centralized error handling

**Files to Modify:**
1. All API routes - Add consistent error responses
2. [`src/lib/logger.ts`](src/lib/logger.ts) - Enhance error logging

#### Implementation Steps

1. **Create Error Utilities** (Day 1)
   ```typescript
   // src/lib/error-handler.ts
   export class AppError extends Error {
     constructor(
       public message: string,
       public statusCode: number = 500,
       public code?: string
     ) {
       super(message)
     }
   }
   
   export function handleAPIError(error: unknown) {
     if (error instanceof AppError) {
       return Response.json(
         { error: error.message, code: error.code },
         { status: error.statusCode }
       )
     }
     
     console.error('Unhandled error:', error)
     return Response.json(
       { error: 'Internal server error' },
       { status: 500 }
     )
   }
   ```

2. **Add Error Boundaries** (Day 1-2)
   - Global error boundary
   - Component-level error boundaries
   - Graceful fallback UI

3. **Enhance API Error Responses** (Day 2)
   - Consistent error format
   - User-friendly messages
   - Error codes for client handling
   - Validation error details

4. **Add Retry Mechanisms** (Day 2-3)
   - Retry failed payment checks
   - Retry email sending
   - Exponential backoff

5. **Testing** (Day 3)
   - Test various error scenarios
   - Verify user-friendly messages
   - Test error recovery
   - Verify logging works

#### Testing Requirements
- [ ] All errors logged properly
- [ ] User sees friendly error messages
- [ ] Error boundaries catch errors
- [ ] Retry mechanisms work
- [ ] API errors consistent format
- [ ] Validation errors clear

---

## 🗓️ 4. Implementation Phases

### Phase 1: Critical Infrastructure (Week 1-2)
**Goal:** Enable real payments and production database

#### Week 1
- **Days 1-3:** Payment Gateway Integration (Midtrans)
  - Setup Midtrans SDK
  - Create Snap token API
  - Integrate Snap.js popup
- **Days 4-5:** Payment Webhook Implementation
  - Webhook handler
  - Order status updates
  - Testing with sandbox

#### Week 2
- **Days 1-2:** Email Service Setup (Resend)
  - Implement email service
  - Create HTML templates
  - Test deliverability
- **Days 3-4:** PostgreSQL Migration
  - Setup database
  - Schema migration
  - Data migration (if needed)
- **Day 5:** Environment & Security
  - Configure all variables
  - Security headers
  - Secrets generation

**Deliverables:**
- ✅ Midtrans payment integration working
- ✅ Production email service operational
- ✅ PostgreSQL database configured
- ✅ All environment variables set

---

### Phase 2: Core MVP Features (Week 3)
**Goal:** Complete core user flows

#### Week 3
- **Days 1-2:** Order Expiry Implementation
  - Set expiry on creation
  - Cron job for expiry
  - Client countdown
- **Days 3-4:** File Upload System
  - Storage service integration
  - Upload API
  - Admin UI for uploads
- **Day 5:** Basic Analytics
  - Analytics API
  - Dashboard UI

**Deliverables:**
- ✅ Orders expire automatically
- ✅ Event images can be uploaded
- ✅ Basic analytics dashboard functional

---

### Phase 3: Polish & Testing (Week 4)
**Goal:** Ensure quality and reliability

#### Week 4
- **Days 1-2:** Enhanced Error Handling
  - Error boundaries
  - User-friendly messages
  - Retry mechanisms
- **Days 2-3:** Camera QR Scanner
  - Scanner component
  - Gate page integration
  - Testing on devices
- **Days 4-5:** Comprehensive Testing
  - End-to-end testing
  - Payment flow testing
  - Email delivery testing
  - Load testing

**Deliverables:**
- ✅ All error scenarios handled
- ✅ QR scanner working (optional)
- ✅ Full testing checklist completed

---

### Phase 4: Deployment (Week 5-6)
**Goal:** Launch to production

#### Week 5
- **Days 1-2:** Deployment Setup
  - Configure hosting
  - Setup CI/CD
  - Domain & SSL
- **Days 3-4:** Staging Environment
  - Deploy to staging
  - Full testing on staging
  - Performance testing
- **Day 5:** Production Deployment
  - Deploy to production
  - Monitor for errors
  - Verify all features

#### Week 6
- **Days 1-3:** Monitoring & Optimization
  - Setup error tracking
  - Configure alerts
  - Performance optimization
- **Days 4-5:** Documentation & Training
  - User documentation
  - Admin documentation
  - Staff training

**Deliverables:**
- ✅ Application live in production
- ✅ Monitoring configured
- ✅ Documentation complete
- ✅ Team trained

---

## 📝 5. Detailed Action Items

### Critical Items Summary

| Item | Priority | Complexity | Time | Dependencies |
|------|----------|------------|------|--------------|
| Payment Gateway (Midtrans) | 🔴 CRITICAL | HIGH | 5-7 days | Midtrans account |
| Email Service (Resend) | 🔴 CRITICAL | MEDIUM | 2-3 days | Resend API key |
| PostgreSQL Migration | 🔴 CRITICAL | MEDIUM | 2-3 days | Database hosting |
| Environment Config | 🔴 CRITICAL | LOW-MEDIUM | 1-2 days | All service accounts |
| Order Expiry | 🟡 HIGH | MEDIUM | 2-3 days | Cron service |
| Deployment Setup | 🟡 HIGH | MEDIUM | 2-3 days | Hosting platform |

### Recommended Items Summary

| Item | Priority | Complexity | Time | Dependencies |
|------|----------|------------|------|--------------|
| File Upload | 🟢 MEDIUM | MEDIUM | 2-3 days | Storage service |
| Camera QR Scanner | 🟢 MEDIUM | MEDIUM | 2-3 days | QR library |
| Basic Analytics | 🟢 MEDIUM | MEDIUM | 3-4 days | None |
| Email Notifications | 🟢 MEDIUM | LOW-MEDIUM | 2 days | Email service |
| Error Handling | 🟢 MEDIUM | LOW-MEDIUM | 2-3 days | None |

---

## 🚀 6. Post-MVP Roadmap

### Phase 5: Enhanced Features (Post-Launch)

#### Priority 1: User Experience (Month 2)
1. **Refund Management**
   - Refund request system
   - Admin approval workflow
   - Automated refund processing
   - Refund notifications

2. **Advanced Search & Filters**
   - Event search by category
   - Date range filtering
   - Location-based search
   - Price range filters

3. **User Dashboard Enhancements**
   - Order history with filters
   - Downloadable receipts
   - Ticket sharing feature
   - Profile management

#### Priority 2: Business Features (Month 3)
1. **Promo Code System**
   - Discount codes
   - Usage limits
   - Expiry dates
   - Analytics tracking

2. **Early Bird Pricing**
   - Time-based pricing tiers
   - Automatic price updates
   - Limited quantity tiers

3. **Seat Selection**
   - Venue seat maps
   - Real-time availability
   - Seat categories
   - Reserved seat tracking

#### Priority 3: Advanced Features (Month 4+)
1. **Multi-Language Support**
   - Next-intl integration complete
   - Indonesian & English
   - Language switcher UI
   - Translated content

2. **Mobile App**
   - React Native app
   - QR code scanner
   - Push notifications
   - Offline ticket access

3. **Advanced Analytics**
   - Custom reports
   - Export functionality
   - Predictive analytics
   - Revenue forecasting

4. **Affiliate Program**
   - Reseller portal
   - Commission tracking
   - Payout management
   - Performance analytics

---

## ⚠️ 7. Risk Assessment

### Technical Risks

#### 1. Payment Gateway Integration
**Risk Level:** 🔴 HIGH  
**Impact:** Critical - No revenue without payments  
**Probability:** Medium

**Mitigation Strategies:**
- Start with Midtrans sandbox thoroughly
- Implement comprehensive error handling
- Add retry mechanisms for failed transactions
- Monitor webhook failures closely
- Have manual payment verification fallback
- Test all payment methods extensively

**Contingency Plan:**
- Manual payment processing temporarily
- Bank transfer with manual confirmation
- Document all failed transactions for retry

#### 2. Database Migration Issues
**Risk Level:** 🟡 MEDIUM  
**Impact:** High - Data loss or corruption  
**Probability:** Low

**Mitigation Strategies:**
- Test migration in staging environment
- Create full backup before migration
- Use Prisma migrate for safety
- Validate data integrity post-migration
- Have rollback plan ready

**Contingency Plan:**
- Restore from backup
- Keep SQLite as fallback temporarily
- Extend testing period

#### 3. Email Deliverability
**Risk Level:** 🟡 MEDIUM  
**Impact:** Medium - User confusion, support load  
**Probability:** Medium

**Mitigation Strategies:**
- Use reputable email service (Resend)
- Configure SPF, DKIM, DMARC
- Monitor bounce rates
- Have email verification process
- Test with multiple email providers

**Contingency Plan:**
- SMS notifications as backup
- In-app notifications
- Manual email sending for critical orders

#### 4. Order Expiry Race Conditions
**Risk Level:** 🟢 LOW  
**Impact:** Medium - Double-booking or lost sales  
**Probability:** Low

**Mitigation Strategies:**
- Use database transactions
- Implement pessimistic locking
- Add idempotency checks
- Test concurrent scenarios
- Monitor for conflicts

**Contingency Plan:**
- Manual order review process
- Customer support intervention
- Refund handling

### Timeline Risks

#### 1. Midtrans Integration Delays
**Risk Level:** 🟡 MEDIUM  
**Impact:** Delays entire timeline  
**Probability:** Medium

**Mitigation Strategies:**
- Start Midtrans integration immediately
- Allocate extra buffer time (2-3 days)
- Have developer experienced with payment gateways
- Maintain good communication with Midtrans support

**Contingency Plan:**
- Consider alternative payment gateway (Xendit, DOKU)
- Extend Phase 1 timeline
- Prioritize core features only

#### 2. Resource Availability
**Risk Level:** 🟡 MEDIUM  
**Impact:** Delays or reduced scope  
**Probability:** Medium

**Mitigation Strategies:**
- Clear developer assignment
- Daily standups for progress tracking
- Early identification of blockers
- Knowledge sharing sessions

**Contingency Plan:**
- Reduce scope to critical features only
- Extend timeline
- Bring in additional resources

### Dependency Risks

#### 1. Third-Party Service Outages
**Risk Level:** 🟡 MEDIUM  
**Impact:** Service unavailable  
**Probability:** Low

**Services at Risk:**
- Midtrans (payment)
- Resend (email)
- Database hosting
- Vercel/hosting platform

**Mitigation Strategies:**
- Choose services with high SLA
- Monitor service status
- Implement graceful degradation
- Have backup communication channels

**Contingency Plan:**
- Queue failed operations for retry
- Manual processing as backup
- Status page for users
- Communication via alternative channels

#### 2. API Rate Limits
**Risk Level:** 🟢 LOW  
**Impact:** Service degradation  
**Probability:** Low (in MVP phase)

**Mitigation Strategies:**
- Monitor API usage
- Implement rate limit handling
- Cache responses where possible
- Plan for scaling

**Contingency Plan:**
- Upgrade service tier
- Implement request queuing
- Temporary feature restrictions

---

## ✅ 8. Success Criteria

### MVP Launch Readiness Checklist

#### Technical Requirements
- [ ] All critical features implemented and tested
- [ ] Payment gateway integration complete and verified
- [ ] Email service operational in production
- [ ] PostgreSQL database deployed and stable
- [ ] Order expiry system functional
- [ ] All environment variables configured
- [ ] Security headers and HTTPS enabled
- [ ] Error tracking configured (Sentry/similar)
- [ ] Monitoring and alerts setup
- [ ] Database backups automated

#### User Flow Validation
- [ ] User can register and verify email
- [ ] User can browse events
- [ ] User can purchase tickets with real payment
- [ ] User receives order confirmation email
- [ ] User receives tickets via email
- [ ] User can view tickets in dashboard
- [ ] Gate operator can scan and validate tickets
- [ ] Admin can manage events
- [ ] Admin can view orders and analytics
- [ ] Staff can access staff portal

#### Performance Requirements
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms (p95)
- [ ] Payment processing time < 10 seconds
- [ ] Email delivery time < 60 seconds
- [ ] Database query time < 100ms (p95)
- [ ] Handles 100 concurrent users
- [ ] Zero critical bugs in production

#### Security Requirements
- [ ] All passwords hashed (bcrypt)
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Secrets not in codebase
- [ ] Production environment variables secure

#### Documentation Requirements
- [ ] README updated with setup instructions
- [ ] API documentation complete
- [ ] User guide created
- [ ] Admin guide created
- [ ] Deployment guide created
- [ ] Troubleshooting guide created
- [ ] Environment variables documented
- [ ] Architecture diagram created

### Key Metrics to Track (Post-Launch)

#### Business Metrics
- **Revenue:** Total sales value
- **Conversion Rate:** Visitors to purchasers
- **Average Order Value:** Revenue per order
- **Customer Acquisition Cost:** Marketing spend per customer
- **Customer Lifetime Value:** Long-term customer value

#### Technical Metrics
- **Uptime:** Target 99.9% availability
- **Error Rate:** Target < 1% of requests
- **Response Time:** Target < 500ms p95
- **Payment Success Rate:** Target > 95%
- **Email Delivery Rate:** Target > 98%

#### User Engagement Metrics
- **Daily Active Users:** Unique daily visitors
- **Repeat Purchase Rate:** Customers with 2+ orders
- **Ticket Scan Rate:** Tickets actually used
- **Cart Abandonment Rate:** Orders started but not completed
- **Support Ticket Volume:** Customer support requests

### MVP Success Definition

**The MVP is considered successful when:**

1. ✅ Users can complete end-to-end purchase flow
2. ✅ Payment processing is reliable (>95% success rate)
3. ✅ Email delivery is consistent (>98% delivery rate)
4. ✅ System uptime is acceptable (>99% uptime)
5. ✅ No critical bugs in production
6. ✅ At least 10 successful real transactions
7. ✅ Gate entry validation working smoothly
8. ✅ Admin can manage system effectively
9. ✅ Support team can assist users
10. ✅ System ready to scale

---

## 📞 Support & Resources

### Technical Documentation
- **Next.js 15:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **NextAuth.js:** https://next-auth.js.org
- **Midtrans:** https://docs.midtrans.com
- **Resend:** https://resend.com/docs

### Development Resources
- **Project Repository:** Internal Git repository
- **Staging URL:** TBD
- **Production URL:** TBD
- **Database Admin:** TBD

### Service Accounts Needed
1. **Midtrans:** Sandbox + Production account
2. **Resend:** Free tier initially
3. **Database Hosting:** PostgreSQL service
4. **Hosting Platform:** Vercel or alternative
5. **Error Tracking:** Sentry account
6. **Storage Service:** Cloudinary/S3 account

---

## 🎯 Next Steps

### Immediate Actions (This Week)
1. ✅ Review and approve this MVP plan
2. ⏳ Create Midtrans sandbox account
3. ⏳ Register Resend account
4. ⏳ Setup PostgreSQL database (Supabase/Neon)
5. ⏳ Create project repository branches (dev, staging, main)
6. ⏳ Assign developers to critical tasks
7. ⏳ Schedule daily standup meetings

### Week 1 Goals
- Start Midtrans integration
- Setup email service
- Configure PostgreSQL
- Create environment templates
- Begin testing strategy

### Communication Plan
- **Daily Standups:** 15 minutes, progress & blockers
- **Weekly Reviews:** Friday, demo & retrospective
- **Stakeholder Updates:** Weekly summary report
- **Issue Tracking:** GitHub Issues or similar
- **Documentation:** Update as you build

---

## 📊 Appendix

### A. Technology Stack Summary
- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (Production), SQLite (Dev)
- **Authentication:** NextAuth.js
- **Payment:** Midtrans Snap
- **Email:** Resend
- **Hosting:** Vercel (recommended)
- **Storage:** Cloudinary (recommended)
- **Monitoring:** Sentry (recommended)

### B. File Structure Reference
```
zai-ticket/
├── prisma/
│   ├── schema.prisma          # Database schema (PostgreSQL)
│   └── migrations/            # Database migrations
├── src/
│   ├── app/                   # Next.js pages & API routes
│   │   ├── api/              # Backend API
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── events/       # Event management
│   │   │   ├── orders/       # Order processing
│   │   │   ├── payments/     # Payment endpoints (NEW)
│   │   │   └── cron/         # Cron jobs (NEW)
│   │   ├── admin/            # Admin dashboard
│   │   ├── gate/             # Gate entry scanner
│   │   ├── payment/          # Payment pages
│   │   └── ...               # Other pages
│   ├── components/           # React components
│   │   └── ui/              # shadcn/ui components
│   ├── lib/                  # Utilities
│   │   ├── auth.ts          # Auth configuration
│   │   ├── db.ts            # Database client
│   │   ├── email.ts         # Email service (UPDATE)
│   │   ├── env.ts           # Environment validation (UPDATE)
│   │   ├── midtrans.ts      # Midtrans integration (NEW)
│   │   └── storage.ts       # File upload service (NEW)
│   └── types/               # TypeScript types
├── .env                      # Environment variables (local)
├── .env.example             # Environment template (NEW)
├── .env.production          # Production variables (NEW)
├── package.json             # Dependencies
└── next.config.ts           # Next.js config (UPDATE)
```

### C. Environment Variables Checklist

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/tiketku
DIRECT_URL=postgresql://user:password@host:5432/tiketku # For migrations

# NextAuth
NEXTAUTH_URL=https://tiketku.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Midtrans
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_MERCHANT_ID=G123456789

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM=TiketKu <noreply@tiketku.com>

# Optional: Storage
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Optional: Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx

# Optional: Redis (Production)
REDIS_URL=redis://localhost:6379
```

### D. Testing Checklist Reference

See [`TESTING.md`](TESTING.md) for authentication testing checklist.

**Additional MVP Testing:**
- [ ] Payment flow end-to-end
- [ ] Email delivery all templates
- [ ] Order expiry automation
- [ ] Database migration successful
- [ ] File upload all formats
- [ ] QR scanner all devices
- [ ] Analytics accuracy
- [ ] Error handling all scenarios
- [ ] Performance under load
- [ ] Security vulnerabilities scan

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-15  
**Next Review:** After Phase 1 completion  
**Status:** Ready for Implementation
