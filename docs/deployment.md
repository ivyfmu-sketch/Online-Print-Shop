# Online Print Shop Deployment Guide

## 1. Infrastructure

- Use HTTPS at the reverse proxy (Nginx, Caddy, Cloudflare Tunnel, or a managed load balancer).
- Run PostgreSQL 15+ and apply `db/schema.sql` before starting the API.
- Run the API on the admin computer if automatic local printing is required, or expose a secured worker service on the admin LAN.
- Install ClamAV for production virus scanning and configure `CLAMAV_HOST` / `CLAMAV_PORT`.

## 2. Backend

```bash
cd apps/api
cp .env.example .env
# edit DATABASE_URL, JWT_SECRET, FILE_ENCRYPTION_KEY, payment keys, printer command
npm install
psql "$DATABASE_URL" -f ../../db/schema.sql
npm start
```

Important production values:

- `JWT_SECRET`: long random secret.
- `FILE_ENCRYPTION_KEY`: 32+ random bytes encoded or a long random passphrase.
- `WEB_ORIGIN`: public frontend origin.
- `PRINTER_COMMAND`: `lp` for CUPS/Linux/macOS or a custom Windows script that accepts a file path.
- `DEFAULT_PRINTER`: OS printer name.
- `RAZORPAY_WEBHOOK_SECRET`: required for webhook authenticity.

## 3. Frontend

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run build
npm start
```

Set `NEXT_PUBLIC_API_URL` to the public API URL, for example `https://api.example.com/api`.

## 4. Payment setup

The application generates a dynamic UPI QR using the configured UPI ID and exact order amount. For production, configure Razorpay, PhonePe, Paytm, or BharatPe webhooks so that payment success updates the order and triggers printing. Store only gateway response IDs/status metadata; never store card, UPI PIN, banking credentials, or sensitive payment instrument details.

## 5. Printer setup

For CUPS:

```bash
lpstat -p
lp -d PRINTER_NAME test.pdf
```

Then set `PRINTER_COMMAND=lp` and `DEFAULT_PRINTER=PRINTER_NAME`. Windows deployments should wrap PowerShell `Start-Process -Verb Print` or vendor CLI tools behind a script and set `PRINTER_COMMAND` to that script.

## 6. Security checklist

- Enforce HTTPS and HSTS at the proxy.
- Keep admins on separate credentials with the `admin` role.
- Restrict upload types and size; use ClamAV in production.
- Keep encrypted storage outside the web root.
- Verify payment webhook signatures before marking paid.
- Back up PostgreSQL but avoid retaining printed files longer than the configured deletion window.
- Review `audit_logs` for sensitive actions.
