# MedLink Production Smoke Test

Run this after every production deployment. The test is intentionally read-only except for the authentication check.

## 1. Health

```bash
curl -fsS https://YOUR_RAILWAY_URL/health
```

Expected HTTP `200` and JSON containing `status: "ok"`.

## 2. HTTPS and API routing

```bash
curl -fsSI https://YOUR_NETLIFY_URL/
curl -fsSI https://YOUR_NETLIFY_URL/api/v1/hospitals
```

The API request may return `401` when the endpoint is protected; it must not return a proxy `502/504`.

## 3. Authentication

Using a dedicated non-production test account, verify login, refresh using the HttpOnly cookie, browser-reload session restoration, and logout/session invalidation. Never use seeded demo credentials in production.

## 4. Database/migrations

Deployment logs must show migrations completing successfully before the API starts. A release fails if migration execution fails or the API starts against an unknown schema.

## 5. WebSocket

Verify authenticated patient, hospital, and driver flows; confirm unauthenticated WebSocket connections are rejected and driver location reaches only the assigned patient.

## 6. Uploads

Verify valid files succeed, MIME/extension mismatches and fake signatures fail, unauthenticated retrieval fails, and authorized authenticated retrieval succeeds.

## 7. Release gate

Do not declare production healthy unless CI, deployment, `/health`, database migrations, HTTPS frontend, authentication/refresh, WebSocket, and upload authorization all pass.
