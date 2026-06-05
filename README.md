# Online Print Shop

A full-stack online printing application with a Next.js frontend, Express API, PostgreSQL schema, encrypted document storage, UPI QR payments, role-based user/admin dashboards, and automatic print job dispatch after verified payment.

## Features

- User registration, login, forgot-password placeholder, JWT authentication.
- Secure uploads for PDF/JPG/JPEG/PNG with size validation, virus-scan hook, page counting, encryption at rest, and preview before upload submission.
- Print settings for mono/color, copies, orientation, A4/A3, and custom page ranges.
- Admin-managed pricing and payment settings.
- Dynamic UPI QR generation for exact payable amount.
- Razorpay webhook endpoint and development mock payment endpoint.
- Automatic printer dispatch after successful payment.
- User dashboard scoped to the authenticated user only.
- Admin dashboard for order metadata, pricing, UPI settings, printer test, reprint, cancel, and transactions.
- Privacy-first admin view: no document preview/download/open endpoints are exposed.

## Quick start

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
psql "$DATABASE_URL" -f db/schema.sql
npm run dev
```

See `docs/deployment.md` for production deployment, payment webhook, printer, and security guidance.
