# EMAS Gold Tracker

EMAS is a production-style Next.js web app for tracking estimated gold buy prices in Malaysia using a Public Gold-inspired pricing model:

`spot XAU/USD -> USD/MYR -> MYR per gram -> spread-adjusted retail estimate`

It includes:

- Live gold price fetching through a server route with provider fallbacks
- Public Gold-style spread simulation with a 5%-10% slider
- RM, gram, and dinar calculator
- Auto refresh every 20 minutes plus manual refresh
- Portfolio profit/loss tracker
- Price alerts with browser notifications
- Mini dashboard, price history, and animated chart
- Dark mode, offline fallback, local caching, and installable PWA support

## Stack

- Next.js App Router
- React
- Tailwind CSS
- Recharts
- TypeScript

## Data flow

The API route at `app/api/gold/route.ts` tries these sources in order:

1. `gold-api.com`
2. `goldapi.io` if `GOLDAPI_API_KEY` is provided
3. `metals-api.com` if `METALS_API_KEY` is provided

USD/MYR is fetched separately and the app applies:

`final_price = ((spot_usd * usdmyr) / 31.1035) * (1 + spread)`

If live fetching fails, the app falls back to:

- the last cached response in memory or local storage
- a generated offline estimate when no cache exists yet

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` if you want premium API providers:

```bash
GOLDAPI_API_KEY=your_key_here
METALS_API_KEY=your_key_here
```

3. Run the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Build

```bash
npm run build
npm run start
```

## Key product features

- Live price display with movement indicator
- Spot vs adjusted comparison
- 24H and 7D chart views
- Cached fallback warning state
- Manual pricing mode for offline use
- Quick amount buttons
- Portfolio analytics
- Browser price alerts
- Local storage for preferences, portfolio, alerts, and last price
- Service worker and manifest for installability

## Notes

- This app provides estimated gold prices and is not affiliated with Public Gold. Actual prices may differ.
- For the most reliable production deployment, configure a paid provider key and host behind HTTPS so notifications and PWA install work properly.
