# Meena Shadi Rishtey (MSR) — Master Project Spec / Build Prompt

> **मीणा शादी रिश्ते** — "हमारा उद्देश्य है कि हम मीणा समाज के लोगों को देश-विदेश में शादी के लिए रिश्ते आसानी से उपलब्ध कराएं"

This document is the single source of truth ("master prompt") for the MSR platform.
Any developer (or AI agent) continuing this project should read it first.

---

## 1. Product

A **community matrimony platform for the Meena samaj** (India + NRI), consisting of:

| Part | Tech | Folder |
|---|---|---|
| REST API + realtime | Node.js, Express, MongoDB (Mongoose), Socket.IO | `backend/` |
| Website + Admin panel | React 18 + Vite + Tailwind CSS | `web/` |
| Mobile app (Android/iOS) | Flutter (Provider, Dio, socket_io_client) | `app/` |
| Deployment | Nginx + PM2 + Let's Encrypt on VPS, sslip.io domain | `deploy/` |

### Brand
- Name: **Meena Shadi Rishtey** · short **MSR** · Hindi **मीणा शादी रिश्ते**
- Colors: deep maroon `#7A1F1F`, brown `#8B4513`, gold `#D4A017`, saffron `#E8762C`, cream `#FFF8EC`
- Fonts: *Playfair Display* (headings), *Poppins* (body), *Noto Sans Devanagari* (Hindi)
- Tone: trustworthy, family-oriented, respectful, bilingual (Hindi + English)

## 2. Users & Roles
- **Member** – a person (or parent/sibling/relative creating on someone's behalf).
- **Admin** – client team: approves profiles, manages ads/banners, plans, success stories, reports.

## 3. Core Features

### 3.1 Authentication — Mobile OTP
- `POST /api/auth/send-otp` generates a random 6-digit OTP (hashed in DB, 5 min expiry, max 5 attempts, resend cooldown 30 s).
- **OTP_MODE=screen** (current): OTP is returned in the API response and **shown on screen** (demo / until an SMS provider is purchased).
- **OTP_MODE=sms**: plug an SMS provider in `backend/src/services/smsService.js` (MSG91 / Fast2SMS / Twilio stubs ready) — only an API key is needed.
- JWT auth (30 days). Admin logs in with email + password.

### 3.2 Biodata Profile (based on the client's Instagram biodata format)
Name, gender, DOB, marital status, height, complexion, diet, **gotra**, mother's gotra, dadi's gotra, nani's gotra, rashi, manglik,
education, occupation, **employed in (Govt / Private / Business / Self / Not working)**, annual income,
country/state/district/city-village, NRI flag, family details (father/mother occupation, brothers, sisters, family type/status),
about me, partner preferences, up to 6 photos with photo-privacy.
Each profile gets a public ID like **MSR10001**. New profiles go to **admin approval** before being visible.

### 3.3 Gotra-aware matching (USP)
Meena tradition avoids marriage within the same gotra and close maternal gotras.
Search excludes a candidate when the candidate's gotra ∈ {my gotra, mother's, dadi's, nani's gotra} **or** my gotra ∈ the candidate's set.
Users can switch the filter off. A **match %** is computed from partner preferences.

### 3.4 Discovery
- Search with filters: age, height, marital status, education, employed-in, state/district, NRI, with-photo, gotra filter, keyword / Profile ID.
- Daily recommendations, new members, featured/premium profiles first.
- Shortlist, "who viewed me", block & report.

### 3.5 Interests & Contact
- Send interest (with optional message) → accept / decline / cancel.
- **Mobile number is hidden** until an interest is accepted, **or** the viewer is a premium member with contact credits.
- Photos can be restricted to accepted connections / premium members.

### 3.6 Realtime Chat (Socket.IO)
- Chat unlocked after an interest is accepted (or for premium members).
- Online status, typing indicator, read receipts, unread counters, realtime notifications.

### 3.7 Premium Plans & Payments
- Plans are dynamic (admin-managed): price, duration, contact-view limit, features.
- Razorpay checkout when keys are configured; otherwise **demo mode** activates the plan (for client demo).
- Admin can activate a plan manually (offline/UPI payment).

### 3.8 Ads & Banners (dynamic)
- Admin uploads banners/ads with placement: `home_hero`, `home_mid`, `dashboard`, `search`, `app_home`, `app_popup`.
- Schedule (start/end date), order, CTA link, impressions + click tracking.
- Website and app render them automatically.

### 3.9 Admin Panel (`/admin` on the website)
Dashboard stats & charts, members (search, block, verify, give premium), profile approvals (approve/reject with reason),
banners/ads, plans, payments, success stories, reports, site settings (contact number, WhatsApp, OTP mode note, gotra list).

### 3.10 Content
Home page with hero, quick search, how it works, why MSR, featured profiles, success stories, plans, app download CTA, testimonials, FAQ;
About, Contact, Privacy Policy, Terms, Safety Tips pages. Hindi/English language toggle everywhere.

## 4. Non-functional
- Security: helmet, CORS allow-list, rate limiting on auth, input validation (zod), Mongo query sanitizing, hashed OTPs, JWT.
- Images compressed to WebP via sharp; stored in `backend/uploads` (served by Nginx).
- Pagination on every list. Indexes on search fields.
- Mobile-first responsive UI.

## 5. Deployment
- VPS: Nginx reverse proxy → Node (PM2, port **5055**, process name `msr-api`), static React build.
- MongoDB in an isolated Docker container bound to `127.0.0.1:27027` (does not touch any existing MongoDB).
- Domain: `msr.<ip-with-dashes>.sslip.io` with free Let's Encrypt SSL.
- Only a **new** Nginx server block is added — existing sites/apps on the VPS are not modified.

## 6. Roadmap (after MVP)
SMS OTP provider, push notifications (FCM), horoscope (kundli) matching, video call, profile verification via ID document,
Play Store release, custom domain.
