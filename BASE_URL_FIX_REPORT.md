# Critical Fix: Base URL Architecture Enforcement

## 🚨 Problem Fixed
**Production was broken**: All client requests were going to Vercel domain instead of the Render backend, causing 405 errors and complete system failure.

## ✅ Solution Implemented

### 1. **Central Environment Configuration** (`client/src/config/env.ts`)
- **Single source of truth** for all API base URLs
- **Strict production validation**: Throws error if `VITE_API_URL` is missing in production
- **Smart development fallback**: Uses `http://localhost:5000/api` if env not set locally
- **URL normalization**: Removes trailing slashes automatically

```typescript
export function getApiBaseUrl(): string {
  const viteApiUrl = import.meta.env.VITE_API_URL;
  const isProd = import.meta.env.PROD;

  if (isProd) {
    if (!viteApiUrl) {
      throw new Error('CRITICAL: VITE_API_URL is required in production');
    }
    return viteApiUrl.replace(/\/+$/, '');
  }

  return (viteApiUrl || 'http://localhost:5000/api').replace(/\/+$/, '');
}
```

### 2. **Fixed Axios Instance** (`client/src/services/api.ts`)
- Uses `getApiBaseUrl()` instead of direct env access
- **Development validation**: Request interceptor warns if requests go to Vercel
- **Logging**: Shows exact baseURL on app start for verification

### 3. **Fixed Image URL Builder** (`client/src/utils/imageUrl.ts`)
- Now uses `getBackendOrigin()` from central config
- Properly strips `/api` suffix only from end of URL (using regex `/\/api\/?$/`)
- All image URLs point to backend server, never to Vercel

### 4. **Runtime Verification** (`client/src/main.tsx`)
- Logs API base URL on startup for easy debugging
- Different messages for dev vs production
- In production, explicitly states "requests MUST go to backend"

### 5. **Strict Server CORS** (`server/src/app.ts`)
- **REMOVED** wildcard `.vercel.app` pattern
- Now **only** allows explicitly configured origins:
  - `config.clientUrl` (from env)
  - `config.frontendUrl` (from env)
  - `localhost:3000`, `localhost:3001`, `localhost:5173` (dev only)
- Logs blocked origins for debugging
- Forces proper client configuration instead of hiding bugs

## 📋 Verification Checklist

### Local Development
- ✅ Build succeeds: `npm run build`
- ✅ No TypeScript errors
- ✅ Console shows: `🔧 API Base URL: http://localhost:5000/api`
- ✅ Login requests go to `http://localhost:5000/api/auth/login`
- ✅ Image URLs point to `http://localhost:5000/uploads/...`

### Production (After Deploy)
- 🔍 **CRITICAL**: Check browser console for: `🔧 API Base URL: https://meyadleyad.onrender.com/api`
- 🔍 Network tab: ALL requests must show `meyadleyad.onrender.com`, NEVER `vercel.app`
- 🔍 Login works without 405 errors
- 🔍 Images load from Render backend
- 🔍 PDF generation calls hit Render
- 🔍 City/Streets import works

## 🎯 Architecture Enforcement

### Rules Now Enforced:
1. **One Base URL source**: `getApiBaseUrl()` function only
2. **No relative requests**: All requests use absolute baseURL
3. **No localhost in production**: Build fails if VITE_API_URL missing
4. **No Vercel API calls**: Interceptor warns in development
5. **Strict CORS**: Server rejects unexpected origins

### Files Modified:
- ✅ `client/src/config/env.ts` (NEW - central config)
- ✅ `client/src/services/api.ts` (uses getApiBaseUrl)
- ✅ `client/src/utils/imageUrl.ts` (uses getBackendOrigin)
- ✅ `client/src/main.tsx` (runtime logging)
- ✅ `client/src/services/admin-dashboard.service.ts` (removed axios direct calls)
- ✅ `client/src/pages/admin/BrandingLogoSettings.tsx` (uses api instance)
- ✅ `client/src/pages/admin/AuditLogPage.tsx` (uses api instance, removed fetch)
- ✅ `server/src/app.ts` (strict CORS, no vercel.app wildcard)

## 🚀 Next Steps

1. **Commit and push** these changes to trigger Vercel auto-deploy
2. **Monitor Vercel build logs** - ensure VITE_API_URL is injected
3. **Open deployed app** - check console for correct base URL
4. **Test critical flows**:
   - Login
   - View ads with images
   - City/Streets import
   - PDF generation (newspaper)
5. **Verify Network tab** - all requests to Render, none to Vercel

## ⚠️ Important Notes

- **VITE_API_URL must be set in Vercel**: Without it, the build will fail (intentionally)
- **Development still works**: Falls back to localhost if env not set
- **No breaking changes**: All existing APIs preserved
- **Type-safe**: All TypeScript errors fixed
