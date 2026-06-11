# LogiMarket — B2B Logistics Marketplace SaaS (PRD)

## Original Problem Statement
Build a production-ready B2B Logistics Marketplace SaaS platform (IndiaMART-style) focused on courier, cargo, logistics, transport, rail/road/air cargo providers across India. Businesses enter pickup/delivery + freight params to instantly discover matching courier partners. Logged-out users see blurred prices/contact. Only verified logged-in businesses see actual rates. Three user types: Business Shippers, Courier Partners, Admin.

## Architecture
- **Frontend**: React 19 + react-router-dom v7 + Tailwind + shadcn/ui + sonner toasts + lucide-react icons
- **Backend**: FastAPI + Motor (async MongoDB) + JWT (HS256) + bcrypt
- **Database**: MongoDB collections — `users`, `coverage`, `rate_cards`, `leads`, `notifications`, `otps`
- **Design**: Swiss/High-contrast — Outfit (display) + Manrope (body), electric blue (#2563eb) primary, rounded-sm, ultra-minimal cards

## User Personas
1. **Business Shipper** — needs verified couriers fast, compares rates, sends quote/callback requests
2. **Courier Partner** — manages rate cards, coverage areas, receives & responds to leads (60-min SLA)
3. **Admin** — approves couriers, monitors marketplace ops, lead SLA, fraud

## Core Requirements (static)
- GST-verified registration (mobile+email+OTP)
- Search by pickup/delivery city + weight + parcel type + transport mode
- Blurred prices/contact for logged-out + non-business users
- Lead generation with 60-min SLA countdown
- Freight calculator (base + fuel + handling + insurance + GST)
- Sort by: lowest rate, fastest delivery, highest rating

## Implemented (Feb 2026)
### Auth
- Mobile OTP (MOCKED — returns `dev_otp: 123456`)
- Business registration with GST format validation
- Courier registration with GST + PAN, auto-pending admin approval
- JWT auth, /api/auth/me endpoint
### Public surface
- Landing page (hero + freight search + trust signals + featured partners + CTA)
- Search results with blurred view for non-business/non-auth
- Sort options (rate/delivery/rating)
### Business
- Dashboard with leads table, profile, verification status
- Request Callback / Get Quote modal with SLA countdown timer
### Courier
- Dashboard stats, leads with status update, rate cards CRUD, coverage management (states/cities/pincodes)
### Admin
- Stats, courier approvals (approve/reject), lead monitoring
### Other
- Freight calculation API (base/fuel/handling/insurance/pickup/delivery/GST/total)
- Mock email notifications (logged to backend on lead create)
- Seeded 6 demo couriers + ~250 rate cards across major Indian metros

## Test Credentials
See `/app/memory/test_credentials.md`

## Backlog / Next
### P0 (post-feedback)
- Real Twilio/SendGrid OTP & email integration
- Real GST government API validation
- Auto SLA reminder cron (30/45/60 min) — schema ready
- Lead distribution to top-5 matching partners (logic stubbed)
### P1
- Subscription/Stripe billing for Premium/Enterprise plans
- Analytics dashboards with charts (recharts is in deps)
- Saved couriers / search history persistence
- Admin GST verification logs page
### P2
- WhatsApp / Push notification webhook architecture
- Pincode-level routing
- SEO: SSR/sitemap (would require Next.js migration)
- API access tier for Enterprise customers
