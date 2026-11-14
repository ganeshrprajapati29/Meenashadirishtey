<p align="center"><img src="web/public/brand/logo-512.png" width="120" alt="MSR logo"></p>

# Meena Shadi Rishtey (MSR) – मीणा शादी रिश्ते

> हमारा उद्देश्य है कि हम मीणा समाज के लोगों को देश-विदेश में शादी के लिए रिश्ते आसानी से उपलब्ध कराएं।

A complete matrimony platform for the Meena samaj: **REST + realtime backend**, **website with admin panel**, and **Android/iOS app**.

| Folder | Stack | What |
|---|---|---|
| [`backend/`](backend) | Node.js · Express · MongoDB · Socket.IO | API, OTP auth, matching, chat, payments, ads |
| [`web/`](web) | React · Vite · Tailwind CSS | Public website, member area, `/admin` panel |
| [`app/`](app) | Flutter (Provider, Dio, socket_io_client) | Mobile app |
| [`deploy/`](deploy) | Bash · nginx · systemd · Docker | One-command VPS install |
| [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) | | Full product spec / master prompt |

## Features
- 📱 Mobile **OTP login** – OTP is generated per request and **shown on screen** (demo) until an SMS provider key is added (`OTP_MODE=sms`)
- 📝 Biodata wizard (based on MSR's Instagram format) – gotra, family, education, job (Govt/Private/…), partner preference, 6 photos
- 🧬 **Gotra-aware matching** – hides own / mother's / dadi's / nani's gotra; match % score
- 🔍 Search & filters, recommendations, shortlist, profile visitors, block & report
- 💌 Interests (send / accept / decline) – phone number revealed only after acceptance or with premium
- 💬 **Realtime chat** (Socket.IO): online status, typing, read receipts, live notifications
- 👑 Premium plans (admin-managed) with Razorpay, or **demo mode** when no keys are set
- 📢 **Dynamic banners & ads** with placement, schedule, click/impression tracking (web + app)
- 🛠 Admin panel: stats & charts, profile approvals, members, premium, banners/ads, plans, payments, stories, reports, enquiries, settings, broadcast
- 🌐 Hindi / English everywhere

## Run locally
```bash
# 1. MongoDB on localhost:27017 (e.g. docker run -d -p 27017:27017 mongo:7)
# 2. API
cd backend && cp .env.example .env   # set MONGO_URI=mongodb://127.0.0.1:27017/meenashadirishtey
npm install && npm run seed:demo && npm run dev          # http://localhost:5055
# 3. Website
cd ../web && npm install && npm run dev                  # http://localhost:5173  (admin: /admin)
# 4. App (Flutter 3.50+)
cd ../app && flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:5055   # Android emulator → local API
```
Demo logins: any phone `9000010000`–`9000010023` (OTP shown on screen). Admin: `admin@meenashadirishtey.com` / `Admin@12345` (local seed).

## Build the Android APK
- **GitHub Actions** → *Build Android APK* runs on every push to `app/**` (or manually) and uploads `MSR-Rishtey.apk` as an artifact.
- Locally: `cd app && flutter build apk --release --dart-define=API_URL=https://msr.72-60-110-25.sslip.io`

## Deploy
See [`deploy/README.md`](deploy/README.md) – one command on the VPS, isolated from other apps, free SSL on an sslip.io domain.

## API overview
| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`, `POST /api/auth/admin/login`, `GET/PATCH/DELETE /api/auth/me` |
| Profiles | `GET /api/profiles/meta`, `GET/POST/PUT /api/profiles/me`, `POST /api/profiles/me/photos`, `GET /api/profiles/search`, `/recommendations`, `/dashboard`, `/shortlist`, `/visitors`, `GET /api/profiles/:id`, `/:id/contact`, `/:id/shortlist`, `/:id/block`, `/:id/report` |
| Interests | `GET/POST /api/interests`, `PATCH/DELETE /api/interests/:id` |
| Chat | `GET /api/chat/conversations`, `GET/POST /api/chat/:userId/messages` + socket events `message:send`, `message:new`, `typing`, `message:read`, `presence`, `notification` |
| Payments | `GET /api/payments/plans`, `POST /api/payments/order`, `POST /api/payments/verify`, `GET /api/payments/history` |
| Public | `/api/public/settings`, `/banners`, `/banners/:id/click`, `/stories`, `/stats`, `/enquiry` |
| Admin | `/api/admin/stats`, `/users`, `/profiles`, `/banners`, `/plans`, `/stories`, `/payments`, `/reports`, `/enquiries`, `/settings`, `/broadcast` |
