# ⚡ GrowwPulse — Smart Market Watchlist & Change Intelligence Engine

> **Turn chaotic market ticker tape into clear, explainable, and actionable change intelligence.**

GrowwPulse is an end-to-end intelligent market watchlist built for modern investors. Instead of overwhelming users with flashing prices and generic 24h percentage swings, GrowwPulse computes **what has meaningfully changed since you last checked**, explains **why it moved** using news catalyst correlation and sector alpha divergence, and highlights **what deserves your attention now**.

Built with the official **Groww Design System** tokens, a clean 3-column desktop layout, and resilient client-server architecture.

---

## 🌟 Key Highlights

- **🧠 "Since You Were Away" Temporal Delta Engine**: Computes exact price, volume, and volatility deviations relative to the user's specific last-seen baseline rather than arbitrary market close timestamps.
- **📰 News Catalyst Correlation**: Automatically matches anomalous price spikes against live financial news feeds to surface root causes (e.g., *"Likely Cause: Q3 Earnings Beat / RBI Rate Decision"*).
- **📊 Sector Alpha Divergence**: Separates general market/sector beta from idiosyncratic stock alpha (e.g., *"+3.2% stock move vs -0.8% NIFTY IT sector = +4.0% alpha divergence"*).
- **⏳ Historical Replay (Time-Travel)**: Allows users to reconstruct market state across temporal presets (`1h`, `4h`, `Market Open`, `1d`) or custom time sliders.
- **🏷️ Intent-Based Tagging**: Tag assets as `Core`, `Speculative`, or `Earnings Play` — the engine automatically adapts anomaly sensitivity based on user intent.
- **🛡️ Reliability Scorecard & Model Self-Evaluation**: Built-in backtest metrics showing signal accuracy, mean-reversion rates, and live data stream health.
- **🧘 Calm Reassurance State ("You Can Relax")**: Thoughtfully designed hero state that informs users when markets are tranquil, preventing unnecessary trading anxiety.

---

## 🎨 Groww Design System Compliance

GrowwPulse strictly implements Groww's UI/UX principles and color specifications:

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Primary Green** | `#00D09C` | Brand Primary, Gain indicators, Success states |
| **Brand Blue** | `#5367F5` | Primary buttons, active highlights, key CTAs |
| **Logo Green** | `#08F6B6` | Accents and badges |
| **Financial Gain** | `#00D09C` | Positive P&L and upward moves |
| **Financial Loss** | `#EF4444` | Negative P&L and downward moves |
| **Surface Canvas** | `#F8FAFC` | Main application background |
| **Card Surface** | `#FFFFFF` | Elevated container cards |
| **Border Neutral** | `#E8ECF2` | Subtle separators and dividers |
| **Primary Text** | `#111827` | Headings and primary data |
| **Secondary Text**| `#6B7280` | Labels, timestamps, and subtitles |

### 3-Column Desktop Layout
1. **Left Sidebar (260px Fixed)**: Navigation, custom watchlists, 60s Demo Tour, Reliability Scorecard, and Notification center.
2. **Center Feed (Spacious Grid)**: Dynamic Attention Cards, Anomaly Badges, Catalyst Summaries, and Calm Reassurance states.
3. **Right Financial Information Panel**: Real-time major Indian indices (`NIFTY 50`, `SENSEX`, `BANK NIFTY`, `NIFTY IT`), Engine Telemetry, and Market Tips.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode, end-to-end type safety)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) customized with Groww color tokens & CSS variables
- **Charts**: [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) by TradingView
- **Database & Storage**: SQLite / Turso (`@libsql/client`) with zero-dependency resilient memory/file fallback
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/) for unit & integration testing suite

---

## 🚀 Quick Start & Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/GrowwPulse.git
cd GrowwPulse
npm install
```

### 2. Configure Environment (Optional)
A pre-configured `.env.example` is provided. If no environment variables are set, the app will gracefully default to local SQLite with built-in market data synthesis:
```bash
cp .env.example .env.local
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Quality Assurance

GrowwPulse includes a comprehensive automated test suite covering authentication, baseline tracking, anomaly detection, watchlist operations, and resilience fallbacks:

```bash
# Run all automated tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Suite Summary:
```text
 ✓ tests/unit/pulse.service.test.ts (8 tests)
 ✓ tests/unit/auth.service.test.ts (6 tests)
 ✓ tests/unit/watchlist.service.test.ts (6 tests)
 ✓ tests/integration/api.test.ts (6 tests)

 Test Files  4 passed (4)
      Tests  26 passed (26)
   Duration  ~1.8s
```

### Production Build Validation
```bash
npm run build
```
Builds all static & dynamic routes (`/`, `/login`, `/dashboard`, `/watchlists`, `/replay`, `/pulse/[eventId]`) with 0 errors.

---

## 📂 Project Structure

```
GrowwPulse/
├── src/
│   ├── app/
│   │   ├── api/v1/             # RESTful API endpoints (auth, pulse, watchlists, news, replay)
│   │   ├── dashboard/          # Central Intelligence Inbox & Feed
│   │   ├── watchlists/         # Watchlist management & Intent tagging
│   │   ├── replay/             # Historical Time-Travel Engine
│   │   ├── pulse/[eventId]/    # Stock deep-dive & Interactive chart
│   │   ├── login/              # Fast demo & credentials login
│   │   ├── globals.css         # Groww design tokens & custom animations
│   │   └── layout.tsx          # App root layout with fonts & metadata
│   ├── components/
│   │   ├── layout/             # Sidebar, Navbar, RightMarketPanel, MobileDrawer
│   │   ├── pulse/              # AttentionCard, AnomalyBadge, CalmState, SixtySecondTour
│   │   ├── stock/              # StockDetailView, LightweightChart, CatalystTimeline
│   │   └── ui/                 # Reusable buttons, badges, modals, inputs
│   ├── lib/
│   │   ├── db/                 # Database schema & SQLite/Turso client
│   │   ├── auth/               # Session management & JWT handling
│   │   ├── market/             # Yahoo Finance & Market Data synthesis
│   │   └── services/           # PulseService, NewsService, WatchlistService
│   └── types/                  # Core TypeScript domain models
├── tests/
│   ├── unit/                   # Unit tests for services & statistical models
│   └── integration/            # API route integration tests
├── public/                     # Static assets & brand graphics
├── package.json
└── README.md
```

---

## 💡 How to Use the App

1. **Instant Login**: On the login page, click **"⚡ Try Demo Account"** to bypass sign-up and load seeded market data.
2. **Check Your Away Delta**: View the top banner showing exactly how many hours/minutes you were away and what changed.
3. **Inspect Anomalies**: Filter by *High Attention*, *Notable Shifts*, or view news catalysts for any flagged stock.
4. **Deep Dive**: Click any stock card to view its price curve with the dashed **"Last Seen Reference"** line and alpha divergence.
5. **Tag Watchlists**: Head to `/watchlists` to tag stocks as `Core` or `Speculative`.
6. **Time-Travel**: Navigate to `/replay` and pick `1h`, `4h`, or `Market Open` to simulate past market conditions.
7. **Verify Accuracy**: Open the **Reliability Scorecard** from the sidebar to inspect backtested signal accuracy.

---

## 📄 License
This project is licensed under the MIT License. Built with ❤️ for investors seeking clarity in market data.
