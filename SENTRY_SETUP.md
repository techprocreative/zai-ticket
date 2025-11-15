# Sentry Error Tracking Setup

Sentry error tracking has been successfully configured for production monitoring.

## 📦 Installed Packages

- `@sentry/nextjs` - Official Sentry SDK for Next.js

## 📁 Configuration Files Created

### 1. **sentry.client.config.ts**
Client-side error tracking configuration with:
- Session replay integration
- Error sampling (100% in production)
- Session replay sampling (10%)
- Privacy controls (mask text and media)

### 2. **sentry.server.config.ts**
Server-side error tracking for API routes and server components.

### 3. **sentry.edge.config.ts**
Edge runtime error tracking for middleware and edge functions.

### 4. **next.config.ts**
Updated with `withSentryConfig()` wrapper including:
- Automatic source maps upload
- React component annotation
- Monitoring tunnel route (`/monitoring`)
- Vercel Cron Monitors integration
- Logger tree-shaking for production

### 5. **src/components/error-boundary.tsx**
React Error Boundary component for graceful error handling:
- Catches React component errors
- Sends errors to Sentry in production
- Shows user-friendly error UI
- Provides "Try Again" and "Reload Page" actions

## 🔐 Environment Variables

Added to `.env.example`:

```bash
# Sentry DSN for error tracking (get from https://sentry.io)
NEXT_PUBLIC_SENTRY_DSN="https://examplePublicKey@o0.ingest.sentry.io/0"

# Sentry Organization (for source maps upload)
SENTRY_ORG="your-organization-slug"

# Sentry Project (for source maps upload)
SENTRY_PROJECT="your-project-slug"

# Sentry Auth Token (for source maps upload - keep secret!)
# SENTRY_AUTH_TOKEN="your-auth-token"
```

Also updated `src/lib/env.ts` for environment validation.

## 🚀 Setup Instructions

### 1. Create Sentry Account
1. Go to [https://sentry.io](https://sentry.io)
2. Create a free account
3. Create a new project (select "Next.js")

### 2. Get Your DSN
1. Go to **Settings** → **Projects** → **[Your Project]**
2. Go to **Client Keys (DSN)**
3. Copy the DSN URL

### 3. Configure Environment Variables

**For Local Development (.env.local):**
```bash
NEXT_PUBLIC_SENTRY_DSN="your-actual-dsn-here"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="your-project-slug"
```

**For Production (Vercel/Platform):**
Add the same variables in your hosting platform's environment settings.

### 4. (Optional) Enable Source Maps Upload

For better error tracking with source maps:

1. Generate an Auth Token in Sentry:
   - Go to **Settings** → **Account** → **API** → **Auth Tokens**
   - Create new token with `project:releases` and `org:read` scopes

2. Add to environment variables:
   ```bash
   SENTRY_AUTH_TOKEN="your-auth-token-here"
   ```

## 🎯 Usage

### Automatic Error Tracking

Sentry automatically captures:
- Unhandled exceptions
- Unhandled promise rejections
- Console errors (in production)
- API route errors
- Server component errors

### Manual Error Tracking

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
}
```

### Using Error Boundary

Wrap your components with ErrorBoundary:

```tsx
import { ErrorBoundary } from "@/components/error-boundary";

export default function Page() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

Or wrap your entire app in `app/layout.tsx`:

```tsx
import { ErrorBoundary } from "@/components/error-boundary";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## 🔒 Security & Privacy

✅ **Enabled only in production** - No tracking in development
✅ **Environment variables** - Sensitive data not committed to git
✅ **Privacy controls** - Text and media masked in session replays
✅ **Tunnel route** - `/monitoring` route to bypass ad-blockers

## 📊 Features Enabled

- ✅ Error tracking (client & server)
- ✅ Performance monitoring (traces)
- ✅ Session replay (10% sample rate)
- ✅ Source maps upload
- ✅ React component annotations
- ✅ Vercel Cron Monitors
- ✅ Error boundary component

## 🎛️ Configuration Options

You can adjust these in the Sentry config files:

- **tracesSampleRate**: `1.0` (100%) - Adjust for production (e.g., `0.1` for 10%)
- **replaysSessionSampleRate**: `0.1` (10%) - Session replay sampling
- **replaysOnErrorSampleRate**: `1.0` (100%) - Replay on errors
- **debug**: `false` - Enable for debugging Sentry itself

## 📝 Notes

- Sentry is **disabled in development** by default
- Source maps upload requires `SENTRY_AUTH_TOKEN`
- Monitor your quota usage on Sentry dashboard
- Free tier: 5,000 errors/month, 50 replays/month

## 🐛 Troubleshooting

**Sentry not tracking errors:**
1. Check `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Verify `NODE_ENV=production`
3. Check Sentry dashboard for project status

**Source maps not uploading:**
1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check `SENTRY_ORG` and `SENTRY_PROJECT` match Sentry
3. Review build logs for upload errors

## 🔗 Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io)
- [Error Boundary Documentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)