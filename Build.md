BUILD.md — Groww Pulse
STATUS: FINAL / FROZEN
This document is the sole implementation authority for Groww Pulse.
Do not redesign the product thesis.
Do not expand scope without explicit approval.
Do not move to the next phase until the current phase passes every acceptance criterion.
Production/demo market data must always be live-fetched or retrieved from genuinely persisted historical observations. No hardcoded market values, fake events, fake analytics, or fake demo branches are permitted.
 
0. AGENT OPERATING CONTRACT
You are the autonomous engineering agent responsible for building Groww Pulse under a strict hackathon constraint.
Your priorities are:
1.	Product correctness
2.	Real/live data
3.	Core user experience
4.	Data integrity and trust
5.	Authentication and persistence
6.	Demo reliability
7.	UX polish
8.	Technical simplicity
Do NOT optimize for:
•	number of technologies
•	number of APIs
•	architectural complexity
•	microservices
•	AI usage
•	feature count
•	theoretical scalability
•	unnecessary infrastructure
Absolute development loop
For every phase:
IMPLEMENT
   ↓
RUN
   ↓
TEST
   ↓
VERIFY
   ↓
FIX
   ↓
RETEST
   ↓
ACCEPTANCE CHECK
   ↓
ONLY THEN MOVE FORWARD
If any acceptance criterion fails:
STOP
↓
FIX CURRENT PHASE
↓
RETEST
Never continue while a required phase is broken.
 
1. PRODUCT INVARIANT
Everything in the application must serve this loop:
LAST SEEN
    ↓
WHAT CHANGED?
    ↓
WAS IT UNUSUAL?
    ↓
CAN WE TRUST THAT CONCLUSION?
    ↓
WHY WAS IT SURFACED?
    ↓
MARK SEEN
The product is NOT:
•	a generic stock dashboard
•	a trading platform
•	a prediction engine
•	a financial chatbot
•	a news aggregator
•	a portfolio manager
It is:
A personalized temporal market inbox.
Core product promise
A normal watchlist tells you what's happening. Pulse tells you what you missed.
Primary UX message:
You were away. Here's what matters.
 
2. PRODUCT EXPERIENCE
The core experience must look conceptually like:
USER LOGS IN
      ↓
LOAD PERSONAL WATCHLIST
      ↓
LOAD PERSONAL LAST-SEEN STATE
      ↓
MARKET CONTINUES MOVING
      ↓
USER RETURNS
      ↓
READ MARKET OBSERVATIONS
      ↓
COMPARE LAST-SEEN → NOW
      ↓
DETERMINE WHAT CHANGED
      ↓
DETERMINE WHETHER IT WAS UNUSUAL
      ↓
CHECK DATA QUALITY / CONFIDENCE
      ↓
RANK EVENTS
      ↓
SHOW PULSE
      ↓
USER UNDERSTANDS WHY
      ↓
MARK SEEN
      ↓
SERVER PERSISTS NEW STATE
      ↓
NEXT VISIT ONLY SHOWS NEW INFORMATION
 
3. CORE UX MESSAGE
The homepage should prominently communicate:
You were away for 4h 32m.

17 stocks moved.
3 deserve your attention.
These values are illustrative only.
The production application MUST calculate them dynamically.
Never hardcode:
17
3
4h 32m
or any other market result.
 
4. THE "17 MOVED, 3 MATTER" PRINCIPLE
The exact numbers are dynamic.
The UI must conceptually support:
{N} stocks moved.

{M} deserve your attention.
Where:
N = number of watchlist securities with a meaningful observed movement
M = number classified as deserving attention by the Pulse heuristic
Do not force a fixed number of highlighted events.
If the data produces zero meaningful events:
24 stocks moved.

0 were unusually outside
their normal behavior.

✓ You're all caught up.
Zero alerts is a valid and successful result.
 
5. PRODUCT NOVELTY
Do not claim that the underlying mathematics are novel.
The product innovation is the combination of:
User-specific last-seen state
        +
Historical market observations
        +
Interval-aware unusualness
        +
Data-quality/confidence
        +
Attention ranking
        +
Explainability
        +
Mark-as-seen state
        +
Historical replay
Position the product as:
A personalized market inbox that tells users what changed since they last looked and filters normal market noise.
 
6. AUTHENTICATION IS P0
Authentication is part of the core product.
The application must support:
SIGN UP
   ↓
LOGIN
   ↓
USER ID
   ↓
USER-SPECIFIC WATCHLIST
   ↓
USER-SPECIFIC LAST-SEEN STATE
When the user returns and logs in again:
LOGIN
 ↓
SAME USER
 ↓
SAME WATCHLIST
 ↓
SAME LAST-SEEN STATE
 ↓
NEW MARKET OBSERVATIONS
 ↓
NEW PULSE
The application must NOT depend on localStorage for authoritative user state.
The server/database is the source of truth.
 
7. TECHNOLOGY STACK
Use a simple, production-like stack.
Frontend
Recommended:
Next.js
React
TypeScript
Tailwind CSS
Authentication
Use:
Clerk
or an equivalent managed authentication provider if required by availability.
Do not build custom password authentication during the hackathon.
Backend
Use:
TypeScript
Node.js
Next.js API routes / route handlers
or a similarly simple TypeScript backend.
Do not introduce microservices.
Database
Use:
PostgreSQL
Supabase Postgres is recommended for rapid deployment.
Market data
Use one verified market-data provider.
Recommended initial candidate:
Twelve Data
Before implementation, verify:
•	required symbol support
•	Indian-market coverage
•	historical data availability
•	volume availability
•	timestamps
•	rate limits
•	authentication
•	pricing/plan restrictions
If the selected provider cannot reliably support the required data, replace it before proceeding.
Charts
Use:
TradingView Lightweight Charts
or another lightweight production-ready charting library.
Deployment
Recommended:
Vercel
for the frontend/application where appropriate, with PostgreSQL and backend functionality deployed using compatible production infrastructure.
 
8. THIRD-PARTY API RULE
Keep third-party dependencies minimal.
Core P0:
Authentication provider
        +
Market data provider
        +
PostgreSQL
Optional:
News API
Optional:
AI API
Do NOT add optional services before the P0 product is complete.
 
9. MARKET DATA RULE
Production/demo market data MUST come from:
LIVE EXTERNAL MARKET DATA
or:
REAL PERSISTED HISTORICAL MARKET OBSERVATIONS
Never fabricate:
•	price
•	percentage change
•	volume
•	timestamp
•	historical data
•	unusualness
•	confidence
•	news
•	market events
•	analytics
•	replay results
Hardcoded fixtures are allowed only inside automated tests.
 
10. NO FAKE DEMO MODE
This is strictly prohibited:
if demoMode:
    return fakeEvents()
Also prohibited:
const demoPrice = 1421;
const demoChange = -4.8;
const demoUnusualness = 2.9;
The demo must use the same production logic.
Correct:
REAL HISTORICAL DATA
        ↓
SAME PULSE ENGINE
        ↓
SAME API
        ↓
SAME UI
 
11. CORE ARCHITECTURE
Use a modular monolith.
                         ┌─────────────────┐
                         │      Clerk      │
                         │ Auth / Sessions │
                         └────────┬────────┘
                                  │
                                  ▼
┌───────────────┐         ┌───────────────┐
│   Next.js     │────────▶│   Pulse API   │
│   Frontend    │◀────────│               │
└───────┬───────┘         └───────┬───────┘
        │                         │
        │                         ▼
        │                 ┌───────────────┐
        │                 │ Pulse Engine  │
        │                 │               │
        │                 │ Returns       │
        │                 │ Volatility    │
        │                 │ Unusualness   │
        │                 │ Confidence    │
        │                 │ Ranking       │
        │                 └───────┬───────┘
        │                         │
        │                         ▼
        │                 ┌───────────────┐
        │                 │ PostgreSQL    │
        │                 │               │
        │                 │ Users         │
        │                 │ Watchlists    │
        │                 │ Snapshots     │
        │                 │ Last Seen     │
        │                 └───────┬───────┘
        │                         ▲
        │                         │
        │                 ┌───────┴───────┐
        │                 │ Market Data   │
        │                 │ Service       │
        │                 └───────┬───────┘
        │                         │
        │                         ▼
        │                 ┌───────────────┐
        │                 │ Market Data   │
        │                 │ Provider      │
        │                 └───────────────┘
        │
        ▼
TradingView Lightweight Charts
 
12. FRONTEND RESPONSIBILITIES
Frontend owns:
•	routing
•	authentication UI
•	user interactions
•	rendering
•	charts
•	loading states
•	error states
•	empty states
•	responsive UI
•	API requests
Frontend MUST NOT own authoritative:
•	market analytics
•	unusualness calculation
•	confidence calculation
•	attention classification
•	ranking
•	last-seen timestamps
 
13. BACKEND RESPONSIBILITIES
Backend owns:
•	authentication verification
•	authorization
•	user identity
•	watchlist persistence
•	market-data access
•	historical persistence
•	Pulse calculations
•	unusualness
•	confidence
•	attention classification
•	ranking
•	replay
•	mark-seen state
 
14. SECURITY INVARIANT
The backend MUST derive the authenticated user ID from the authentication session.
Never trust:
{
  "userId": "client-supplied-user-id"
}
as authorization.
Correct:
Request
 ↓
Verify session
 ↓
Get authenticated user ID
 ↓
Query user's data
Every user-owned database query must be scoped to the authenticated user.
 
15. DATABASE MODEL
Use PostgreSQL.
Minimum tables:
users
symbols
watchlists
watchlist_items
market_snapshots
user_symbol_state
Optional:
market_context
if contextual news is implemented.
 
16. USERS
Conceptually:
users
---------
id
auth_provider_id
created_at
updated_at
The external auth provider identity must map to the application's user.
 
17. WATCHLISTS
Conceptually:
watchlists
-----------
id
user_id
name
created_at
updated_at
Users can have one or more watchlists.
At minimum, one active watchlist must work reliably.
 
18. WATCHLIST ITEMS
Conceptually:
watchlist_items
---------------
id
watchlist_id
symbol
created_at
Users can:
•	search supported symbols
•	add symbols
•	remove symbols
•	view symbols
 
19. MARKET SNAPSHOTS
Conceptually:
market_snapshots
----------------
id
symbol
price
volume
source
source_timestamp
received_timestamp
created_at
volume may be nullable if the provider does not reliably supply it.
 
20. SOURCE TIME VS RECEIVED TIME
These are different concepts and MUST be stored separately.
Source timestamp
When the provider says the market observation occurred.
Received timestamp
When the backend received the observation.
Example:
Observed:
14:56:12

Received:
14:56:13
Never substitute backend receive time for market event time.
 
21. DATA FRESHNESS
The application must determine whether the latest market data is fresh.
If data is stale:
STALE
Updated 8 minutes ago
Do NOT display:
LIVE
when the data is not actually fresh.
Freshness thresholds must be configurable.
 
22. OUT-OF-ORDER DATA
Older observations must never overwrite newer observations.
Example:
Observation A
10:05

Observation B
10:04
Observation B cannot become the latest observation.
Use source timestamps where reliable.
 
23. MARKET DATA ABSTRACTION
Create:
MarketDataProvider
Conceptually:
MarketDataProvider
├── getQuote(symbol)
└── getHistoricalData(symbol, from, to, interval)
Provider-specific logic must remain isolated.
The Pulse Engine must not know provider-specific implementation details.
 
24. LAST-SEEN STATE
For each:
user + symbol
maintain:
last_seen_timestamp
Optionally:
last_seen_price
if technically useful.
The authoritative value must be server-side.
 
25. SHARED MARKET DATA
Market observations should be shared at the symbol level.
Correct:
                 RELIANCE
                    │
            Market Snapshots
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
      User A      User B      User C
     last_seen   last_seen   last_seen
Do NOT make unnecessary market-data provider requests separately for every user.
 
26. API CONTRACT
Use a versioned API namespace:
/api/v1
Minimum routes:
GET    /api/v1/me

GET    /api/v1/watchlists
POST   /api/v1/watchlists
GET    /api/v1/watchlists/:id
DELETE /api/v1/watchlists/:id

GET    /api/v1/watchlists/:id/symbols
POST   /api/v1/watchlists/:id/symbols
DELETE /api/v1/watchlists/:id/symbols/:symbol

GET    /api/v1/market/quotes
GET    /api/v1/market/history

GET    /api/v1/pulse
GET    /api/v1/pulse/:eventId

POST   /api/v1/pulse/replay

POST   /api/v1/seen
POST   /api/v1/seen/all
The exact framework routing syntax may differ, but the responsibilities must remain equivalent.
 
27. PULSE API
Frontend should request:
GET /api/v1/pulse
Backend performs:
authenticate
 ↓
get user
 ↓
get active watchlist
 ↓
get user last-seen state
 ↓
get relevant market observations
 ↓
calculate Pulse
 ↓
return ranked events
Frontend renders the result.
 
28. PULSE RESPONSE
Conceptually:
{
  "away": {
    "since": "timestamp",
    "durationMinutes": 272
  },
  "summary": {
    "moved": 17,
    "attention": 3
  },
  "events": [
    {
      "symbol": "RELIANCE",
      "attention": "HIGH",
      "return": -0.048,
      "unusualness": 2.9,
      "confidence": "HIGH",
      "reason": "Movement was significantly larger than its typical movement over a comparable interval."
    }
  ]
}
These are response-shape examples only.
Do not hardcode the values.
 
29. PULSE ENGINE
The Pulse Engine is the core intelligence.
Conceptually:
last seen
    ↓
historical observations during absence
    ↓
reference observation
    ↓
current/evaluation observation
    ↓
observed movement
    ↓
expected movement
    ↓
unusualness
    ↓
confidence
    ↓
attention
    ↓
ranking
 
30. RETURN CALCULATION
Use real observations.
Conceptually:
return =
(current_price - reference_price)
/
reference_price
A log-return formulation may be used where appropriate.
Document the selected method.
 
31. NO UNIVERSAL PERCENTAGE THRESHOLD
Do NOT make the primary intelligence:
if change > 5%:
    HIGH
Different securities have different normal behavior.
The system must consider each security's historical behavior.
 
32. INTERVAL-AWARE VOLATILITY
This is mandatory.
A user may be away for:
20 minutes
or:
6 hours
Do not compare a multi-hour return directly with a single-period volatility estimate.
Conceptually:
historical base returns
        ↓
base volatility
        ↓
number of base intervals
        ↓
interval-adjusted expected volatility
A practical heuristic may use:
expected_volatility
≈
base_volatility × sqrt(N)
where:
N = number of comparable base intervals
This is a normalization heuristic, not a claim of perfect financial modeling.
 
33. UNUSUALNESS
Calculate something conceptually similar to:
unusualness =
absolute observed movement
/
expected movement
A standardized-return approach is also acceptable.
The UI should preferably communicate:
2.9× normal movement
rather than:
2.87σ
unless technical detail is requested.
 
34. CONFIDENCE / DATA QUALITY
Every analytical conclusion must account for data quality.
Possible states:
HIGH CONFIDENCE
LIMITED
INSUFFICIENT DATA
If insufficient history exists:
Not enough historical data to determine
whether this movement is unusual.
Do NOT generate precise-looking analytics from insufficient data.
 
35. VOLUME ANOMALY
Volume is secondary.
If reliable volume data is available, compare it against an appropriate historical baseline.
Prefer comparable intraday windows where practical.
Do NOT blindly compare:
current intraday volume
/
average daily volume
If a defensible comparison cannot be made:
omit volume analysis.
Never fabricate it.
 
36. ATTENTION HEURISTIC
Call the system:
Pulse attention heuristic
Do NOT call it:
•	predictive AI
•	investment recommendation engine
•	financial prediction model
Primary signal:
movement unusualness
Secondary signals may include:
volume unusualness
context availability
confidence
 
37. ATTENTION LEVELS
Use:
NORMAL
WATCH
IMPORTANT
HIGH ATTENTION
Thresholds must be centralized and configurable.
Never scatter magic numbers across the codebase.
 
38. RANKING
Ranking is more important than exposing an arbitrary score.
Internally you may calculate:
attentionScore
Externally show:
#1 RELIANCE
#2 TCS
#3 INFY
The user needs to understand:
Why was this surfaced?
not:
Why did it receive a score of 82.7?
 
39. EXPLANATION
Every highlighted event must answer:
WHAT?
What changed?
HOW MUCH?
How large was the movement?
RELATIVE TO WHAT?
How unusual was it?
WHY SURFACED?
Why did Pulse prioritize it?
Example:
RELIANCE fell 4.8% since you last checked.

The move was approximately 2.9× its
typical movement over a comparable interval.

Trading activity was also elevated.
All values must be generated dynamically.
 
40. LANGUAGE RULE
Do NOT claim:
This is important for your investment.
Do NOT claim:
This stock will rise.
Do NOT claim:
The stock fell because of this article.
Prefer:
Why was this surfaced?

The movement was significantly larger
than its typical movement over a
comparable interval.
This is a product attention heuristic, not investment advice.
 
41. PRIMARY FRONTEND ROUTES
Recommended:
/login
/dashboard
/watchlists
/watchlists/[id]
/pulse/[eventId]
/replay
/dashboard is the primary experience.
 
42. DASHBOARD
The dashboard must immediately answer:
What did I miss?
Conceptually:
GOOD MORNING

You were away for 4h 32m.

17 stocks moved.
3 deserve your attention.
Then ranked events.
Then normal movements.
Then:
[ Mark all as seen ]
 
43. DETAIL PAGE
Clicking a Pulse event should show:
RELIANCE

₹1,421
↓ 4.8%

2.9× normal movement

HIGH CONFIDENCE
Then:
WHAT HAPPENED
with a readable chart.
Then:
WAS IT UNUSUAL?

Actual movement
-4.8%

Typical movement
±1.7%

Unusualness
2.9× normal
Then:
WHY WAS THIS SURFACED?

The movement was significantly larger
than its typical movement over a
comparable interval.
Then, where valid:
VOLUME
2.3× normal
Then:
DATA DETAILS

Observed
14:56:12

Received
14:56:13

Source
Market-data provider

Freshness
Live
 
44. PROVENANCE
Provenance should be visible but not dominant.
Main interface:
Data details ⓘ
Expanded:
Source
Observed
Received
Freshness
 
45. MARK AS SEEN
Endpoint:
POST /api/v1/seen
The backend must:
authenticate
 ↓
verify symbol belongs to user's watchlist
 ↓
set last_seen_timestamp using server time
Do not trust a client-provided timestamp.
After marking seen, refreshing the application should no longer treat that information as unseen.
 
46. MARK ALL AS SEEN
Endpoint:
POST /api/v1/seen/all
Backend:
authenticated user
 ↓
active watchlist
 ↓
update relevant user_symbol_state records
 ↓
server timestamp
Then display:
✓ You're all caught up.
 
47. HISTORICAL REPLAY — P0 DEMO FEATURE
Replay is mandatory.
The user must be able to ask:
What would Pulse have shown me if I had checked earlier?
Possible UI:
Replay

[ 1 hour ago ]
[ 4 hours ago ]
[ Market open ]
[ Custom time ]
The selected time is a real reference time.
 
48. REPLAY MUST USE THE SAME ENGINE
Never create a fake replay algorithm.
Correct:
REAL HISTORICAL SNAPSHOTS
        ↓
REFERENCE TIME
        ↓
SAME PULSE ENGINE
        ↓
SAME RANKING
        ↓
SAME UI
Live and replay must share the same analytical implementation.
 
49. PULSE REQUEST MODEL
Conceptually:
PulseRequest
{
    userId
    watchlist
    referenceTime
    evaluationTime
}
Live:
referenceTime = user's lastSeen
evaluationTime = now
Replay:
referenceTime = selected historical time
evaluationTime = selected historical endpoint
The authenticated user ID must still be derived server-side.
 
50. LIVE VS REPLAY
Both paths must converge on:
Pulse Engine
Do not duplicate logic.
                 ┌── LIVE ────────┐
                 │                │
Reference Time ──┤                ▼
                 │          PULSE ENGINE
                 │                ▲
                 └── REPLAY ─────┘
 
51. EMPTY STATE
If nothing unusual happened:
YOU'RE ALL CAUGHT UP

The market moved while you were away,
but nothing in your watchlist moved
unusually enough to deserve attention.

Last checked
10:24 AM
This is a first-class product state.
 
52. LOADING STATES
Never show blank screens.
Use clear loading states:
Loading your watchlist...
Fetching latest market data...
Analyzing what changed...
Do not show fake values while loading.
 
53. ERROR STATES
Handle:
•	authentication failure
•	market-data provider failure
•	database failure
•	stale data
•	insufficient history
•	invalid symbol
•	network failure
•	API timeout
Do not hide errors behind fake fallback values.
 
54. PROVIDER FAILURE
If market data cannot be retrieved:
Do NOT display fabricated prices.
Show an explicit state such as:
Market data temporarily unavailable.

Please try again.
If historical data is available but current data is unavailable, clearly distinguish:
Historical data available
Current data unavailable
 
55. OPTIONAL NEWS
Only implement after all P0 requirements are complete.
Purpose:
Provide contextual information.
Not:
Prove why a stock moved.
Use wording such as:
Market context

A company announcement was published
at 14:32.

[ Read context ]
Never assert causality without evidence.
 
56. OPTIONAL AI
AI is not part of the core intelligence.
Correct architecture:
REAL MARKET DATA
       ↓
DETERMINISTIC ANALYTICS
       ↓
STRUCTURED FACTS
       ↓
OPTIONAL AI
       ↓
HUMAN-READABLE EXPLANATION
AI must never determine:
•	price
•	movement
•	unusualness
•	volume
•	confidence
•	market facts
•	causality
If AI fails, the product must continue working.
 
57. REALTIME
Realtime streaming is NOT required.
Use:
30–60 second polling
or:
on-demand refresh
depending on provider capabilities.
Do not add WebSockets unless every P0 and P1 requirement is already complete.
 
58. PHASE 0 — PROJECT FOUNDATION
Goal
Create a working project skeleton.
Implement:
•	repository
•	Next.js/React/TypeScript
•	styling system
•	backend API structure
•	environment configuration
•	PostgreSQL connection
•	migrations
•	base error handling
•	health endpoint
•	linting
•	formatting
•	test framework
Create internal modules:
auth/
users/
watchlists/
market/
pulse/
replay/
seen/
Do not implement fake market data.
Phase 0 acceptance gate
Verify:
Application starts
        ↓
Frontend loads
        ↓
Backend responds
        ↓
Database connects
        ↓
Migration succeeds
        ↓
Health endpoint succeeds
        ↓
Tests execute
        ↓
No critical build errors
If ANY fails:
STOP.
 
59. PHASE 1 — AUTHENTICATION
Goal
Implement real authentication.
Users must be able to:
Sign up
Login
Logout
Return
Login again
Map the external auth identity to an internal user.
Acceptance gate
Test:
Create account
 ↓
Login
 ↓
User identified
 ↓
Refresh page
 ↓
Session remains valid
 ↓
Logout
 ↓
Protected page unavailable
 ↓
Login again
 ↓
Same user identity restored
No hardcoded users.
No fake authentication.
If this fails:
STOP.
 
60. PHASE 2 — WATCHLIST
Goal
Implement persistent watchlists.
Users can:
Create watchlist
Select watchlist
Search symbol
Add symbol
Remove symbol
Refresh
Return later
Acceptance gate
Test:
Login
 ↓
Create watchlist
 ↓
Add symbols
 ↓
Refresh
 ↓
Symbols remain
 ↓
Logout
 ↓
Login
 ↓
Same watchlist appears
 ↓
Remove symbol
 ↓
Symbol disappears
Data must come from PostgreSQL.
No hardcoded watchlists.
If this fails:
STOP.
 
61. PHASE 3 — REAL MARKET DATA
Goal
Integrate the selected market-data provider.
Implement:
getQuote()
getHistoricalData()
Persist real observations.
Store:
price
volume where available
source
source_timestamp
received_timestamp
Implement:
•	timeout handling
•	provider errors
•	rate limits
•	stale detection
•	out-of-order protection
•	retries where appropriate
Acceptance gate
Verify:
Add real supported symbol
 ↓
Fetch quote
 ↓
Display real price
 ↓
Persist snapshot
 ↓
Fetch historical observations
 ↓
Persist historical observations
 ↓
Display source timestamp
 ↓
Handle provider error
 ↓
Handle stale state
Verify that changing the provider response changes the displayed value.
No fake production data.
If this fails:
STOP.
 
62. PHASE 4 — HISTORICAL SNAPSHOT PIPELINE
Goal
Make sure the system has real historical observations suitable for Pulse.
Implement:
symbol
 ↓
historical observations
 ↓
database
 ↓
query by time range
Support:
from
to
interval
Handle:
•	missing observations
•	duplicate observations
•	irregular timestamps
•	market gaps
•	insufficient history
Acceptance gate
For at least one real supported symbol:
Fetch historical data
 ↓
Persist it
 ↓
Query time range
 ↓
Return observations ordered by source timestamp
 ↓
Verify no newer observation is replaced by older data
If this fails:
STOP.
 
63. PHASE 5 — PULSE ENGINE
Goal
Implement deterministic analytics.
Implement and test:
return
historical returns
rolling volatility
interval normalization
expected movement
unusualness
confidence
attention
ranking
No AI.
No fake events.
No hardcoded outputs.
Required edge cases
Handle:
insufficient history
missing observations
duplicate observations
irregular intervals
zero volatility
invalid prices
data gaps
market closure
Acceptance gate
Unit tests must pass for:
Return calculation
Volatility
Interval scaling
Expected movement
Unusualness
Confidence
Attention classification
Ranking
Then run the engine against real persisted market observations.
The resulting output must be explainable.
If analytics are broken or nonsensical:
STOP.
 
64. PHASE 6 — LAST-SEEN ENGINE
Goal
Implement the temporal user state.
For every relevant:
user + symbol
persist:
last_seen_timestamp
Implement:
initial state
mark seen
mark all seen
load state
Acceptance gate
Test:
User logs in
 ↓
Initial last-seen established
 ↓
Market observations occur
 ↓
User returns
 ↓
Only observations after last-seen are evaluated
Then:
Mark seen
 ↓
Refresh
 ↓
Previously seen event is no longer new
Then:
Logout
 ↓
Login again
 ↓
State remains correct
If this fails:
STOP.
 
65. PHASE 7 — PULSE API
Goal
Connect:
Authentication
+
Watchlist
+
Last Seen
+
Historical Market Data
+
Pulse Engine
into one API.
Implement:
GET /api/v1/pulse
The backend must:
authenticate
 ↓
load user's watchlist
 ↓
load last-seen state
 ↓
query observations
 ↓
run Pulse Engine
 ↓
rank results
 ↓
return response
Acceptance gate
A real authenticated user can call Pulse and receive:
away duration
stocks moved
attention count
ranked events
movement
unusualness
confidence
reason
No hardcoded response values.
If this fails:
STOP.
 
66. PHASE 8 — PULSE DASHBOARD
Goal
Build the main product experience.
Homepage must lead with:
You were away.

N stocks moved.
M deserve your attention.
Then:
HIGH ATTENTION
IMPORTANT
WATCH
NORMAL
Normal movements must be visually de-emphasized.
Acceptance gate
Complete:
Login
 ↓
Dashboard
 ↓
Real watchlist
 ↓
Real market observations
 ↓
Dynamic away duration
 ↓
Dynamic movement count
 ↓
Dynamic attention count
 ↓
Ranked Pulse events
No placeholder data.
If this experience is not clear:
STOP.
 
67. PHASE 9 — EVENT DETAIL
Goal
Make every highlighted event understandable.
Show:
WHAT HAPPENED
HOW MUCH
WAS IT UNUSUAL
CONFIDENCE
WHY SURFACED
DATA DETAILS
Use a real chart based on actual observations.
Show provenance where available.
Acceptance gate
Click an event and verify:
Correct symbol
Correct reference time
Correct evaluation time
Correct movement
Correct unusualness
Correct confidence
Correct explanation
Real chart data
Real timestamps
No hardcoded event details.
If this fails:
STOP.
 
68. PHASE 10 — MARK SEEN
Goal
Complete the inbox loop.
Implement:
POST /api/v1/seen
POST /api/v1/seen/all
Server timestamp must be authoritative.
Acceptance gate
Test:
Pulse exists
 ↓
Mark event seen
 ↓
Refresh
 ↓
Event no longer appears as unseen
Then:
Mark all seen
 ↓
Refresh
 ↓
You're all caught up
Then:
Logout
 ↓
Login
 ↓
Seen state remains
If this fails:
STOP.
 
69. PHASE 11 — HISTORICAL REPLAY
Goal
Make the core experience demoable deterministically.
Implement:
POST /api/v1/pulse/replay
Support a selected historical reference/evaluation time.
Replay must use:
REAL HISTORICAL SNAPSHOTS
and:
THE SAME PULSE ENGINE
Acceptance gate
Test:
Select historical time
 ↓
Fetch historical observations
 ↓
Run same Pulse Engine
 ↓
Generate ranked results
 ↓
Display same Pulse UI
Verify that changing the replay time changes the analytical window and potentially the results.
No fake demo branch.
If this fails:
STOP.
 
70. PHASE 12 — TRUST / DATA QUALITY
Goal
Make the financial experience trustworthy.
Implement:
•	stale indicators
•	confidence
•	insufficient-history states
•	provenance
•	source timestamps
•	received timestamps
•	clear data-source labeling
•	provider error states
Acceptance gate
Verify:
Fresh data → fresh state
Stale data → stale state
Insufficient history → insufficient state
Valid history → confidence calculated
Provider failure → honest error
No fake fallback values.
If this fails:
STOP.
 
71. PHASE 13 — UX POLISH
Only begin after every P0 requirement is working.
Improve:
•	visual hierarchy
•	typography
•	spacing
•	charts
•	animations
•	loading states
•	error states
•	empty states
•	mobile responsiveness
•	accessibility
•	navigation
•	perceived performance
The UI should feel:
•	calm
•	modern
•	trustworthy
•	financial
•	high information density
•	restrained
Avoid:
•	excessive gradients
•	fake AI aesthetics
•	dashboard clutter
•	unnecessary animations
•	technical jargon
 
72. PHASE 14 — OPTIONAL FEATURES
Only if ALL previous phases pass.
Order:
1. Contextual news
2. AI wording
3. More sophisticated realtime behavior
Never sacrifice P0 for these.
If time is limited:
CUT OPTIONAL FEATURES
Do not cut:
Authentication
Real data
Historical snapshots
Last seen
Pulse
Confidence
Ranking
Explanation
Mark seen
Replay
 
73. FRONTEND/BACKEND ROUTING INVARIANT
The following separation is mandatory.
Frontend:
UI
 ↓
authenticated API request
 ↓
Backend
Never:
Browser
 ↓
Market-data provider
The browser must never contain market-provider secrets.
Backend:
Auth verification
 ↓
Authorization
 ↓
Business logic
 ↓
Database / provider
 
74. API AUTHORIZATION INVARIANT
For every user-owned route:
request
 ↓
verify authentication
 ↓
derive user ID
 ↓
verify ownership
 ↓
execute operation
For example:
GET /api/v1/watchlists/:id
must verify that the watchlist belongs to the authenticated user.
Do not rely on the frontend to enforce ownership.
 
75. ENVIRONMENT VARIABLES
Secrets MUST be stored in environment variables.
Examples:
DATABASE_URL
MARKET_DATA_API_KEY
AUTH_SECRET
AUTH_PROVIDER_KEYS
Never commit secrets.
Never put server-only secrets into client-side environment variables.
Never log secrets.
Provide:
.env.example
with variable names but no actual credentials.
 
76. NO HARDCODED BUSINESS RESULTS
Forbidden in production code:
17 stocks
3 attention
₹1,421
-4.8%
2.9×
4h 32m
unless dynamically calculated or merely presented as static UI examples outside production logic.
Even demo data must come from real persisted historical observations.
 
77. TEST DATA RULE
Hardcoded fixtures are permitted only for:
unit tests
integration tests
edge-case tests
They must never leak into production/demo execution.
 
78. TESTING REQUIREMENTS
Minimum:
Unit tests
return
volatility
interval scaling
expected movement
unusualness
confidence
attention
ranking
Integration tests
authentication
watchlist
market snapshots
last seen
Pulse
mark seen
replay
authorization
Critical E2E
signup/login
 ↓
watchlist
 ↓
real market data
 ↓
last seen
 ↓
historical interval
 ↓
Pulse
 ↓
event detail
 ↓
mark seen
 ↓
refresh
 ↓
state persists
 ↓
replay
The critical E2E flow is more important than a huge number of low-value tests.
 
79. DEMO ACCEPTANCE TEST
Before declaring the project finished, perform this exact flow:
1. Open deployed application
2. Create/login user
3. Create/select watchlist
4. Add several real supported symbols
5. Verify real market data
6. Establish last-seen state
7. Select historical replay or return after data changes
8. Generate Pulse
9. See dynamic "N moved / M deserve attention"
10. Open highest-ranked event
11. Understand why it was surfaced
12. Inspect confidence
13. Inspect provenance
14. Mark event seen
15. Refresh
16. Verify state persists
17. Mark remaining events seen
18. Verify "You're all caught up"
19. Run historical replay
20. Verify replay uses the same Pulse logic
If any step fails:
The project is not done.
 
80. DEPLOYMENT ACCEPTANCE
The production deployment must verify:
[ ] Frontend loads
[ ] Authentication works
[ ] Backend works
[ ] Database works
[ ] Real market API works
[ ] Historical data works
[ ] Pulse works
[ ] Last-seen works
[ ] Mark seen works
[ ] Replay works
[ ] Charts work
[ ] Error states work
[ ] Secrets protected
[ ] No critical console errors
[ ] No broken API calls
Do not declare completion based only on local development.
 
81. OBSERVABILITY
At minimum provide:
health endpoint
structured server logs
provider error logging
request error logging
Do not log:
•	API keys
•	authentication secrets
•	sensitive user information
•	unnecessary credentials
 
82. PERFORMANCE
Do not prematurely optimize.
Preserve the correct architecture:
one market observation
        ↓
shared across users
not:
one user
        ↓
one market API request
Use database indexes for:
symbol
source_timestamp
user_id
watchlist_id
where appropriate.
 
83. FUTURE SCALE — DOCUMENT ONLY
Do NOT implement during the hackathon:
Kafka
RabbitMQ
Kubernetes
microservices
complex event buses
multiple databases
A future production architecture could evolve into:
Market Providers
       ↓
Ingestion
       ↓
Event Stream
       ↓
Symbol Analytics
       ↓
Time-Series Storage
       ↓
Caching
       ↓
Stateless APIs
       ↓
Clients
The hackathon architecture remains:
Provider
   ↓
Backend
   ↓
PostgreSQL
   ↓
Pulse Engine
   ↓
API
   ↓
Frontend
 
84. FINAL UI HIERARCHY
Always prioritize:
ATTENTION
    ↓
STOCK
    ↓
MOVEMENT
    ↓
UNUSUALNESS
    ↓
CONFIDENCE
    ↓
EXPLANATION
    ↓
CONTEXT
    ↓
DATA DETAILS
Do not show statistical methodology before telling the user what happened.
 
85. PRODUCT LANGUAGE
Prefer:
What did I miss?
Why was this surfaced?
2.9× normal movement
High confidence
Limited data
You're all caught up
Avoid:
BUY
SELL
GUARANTEED
PREDICTION
THIS WILL RISE
THIS WILL FALL
Pulse is informational, not investment advice.
 
86. DEMO SCRIPT
The demo should be approximately 2–3 minutes.
Opening:
"A normal watchlist tells you what's happening. But if I haven't opened Groww for four hours, it doesn't tell me what I actually missed."
Then:
"Pulse solves that."
Show:
You were away.

17 stocks moved.
3 deserve your attention.
Then open the highest-ranked event.
Say:
"This wasn't surfaced simply because it crossed an arbitrary percentage threshold."
Show:
-4.8%

2.9× normal movement

High confidence
Explain:
"We compare the movement against the stock's own historical behavior over a comparable interval."
Show:
Observed
14:56:12

Received
14:56:13
Then:
"We preserve data provenance, so we know when the market observation happened and when our system received it."
Mark seen.
Show:
You're all caught up.
Then demonstrate:
Replay
Explain:
"And this isn't a fake demo mode. Replay runs the same Pulse engine against real historical observations."
 
87. JUDGE-FACING TECHNICAL EXPLANATION
Use:
"The core insight is that a watchlist has temporal context. We persist a user's last-seen state while storing shared market observations at the symbol level. When the user returns, we reconstruct what happened during that interval. Instead of using a universal percentage threshold, we normalize the movement against the security's expected behavior over a comparable time interval. Pulse then prioritizes the changes that are genuinely unusual, communicates confidence, and explains why they were surfaced."
 
88. PRODUCT
Absolutely — your BUILD.md is already strong. I’d continue it from Section 88 with the remaining implementation governance, routing, data contracts, acceptance rules, and final definition of done.
88. PRODUCT DECISION RULE
When making an implementation decision, use this priority order:
1. Preserve the core Pulse experience
2. Preserve data correctness
3. Preserve user state
4. Preserve explainability
5. Simplify implementation
6. Improve visual polish
7. Add optional capability
If a technical decision conflicts with the product experience:
Preserve the experience and simplify the implementation.
Do not introduce architectural complexity merely because it is technically impressive.
 
89. SINGLE SOURCE OF TRUTH
There must be one authoritative implementation for each core responsibility.
Market data
One market-data abstraction.
Analytics
One Pulse Engine.
Authentication
One authentication/session mechanism.
User state
PostgreSQL is authoritative.
Last seen
user_symbol_state is authoritative.
Replay
Uses the same Pulse Engine as live Pulse.
Frontend
Displays backend-derived facts.
Avoid duplicate implementations such as:
Frontend unusualness calculation
+
Backend unusualness calculation
or:
Live Pulse algorithm
+
Separate replay algorithm
There must be one source of truth.
 
90. ROUTING ARCHITECTURE
The application must clearly separate:
PUBLIC FRONTEND ROUTES
        ↓
AUTHENTICATED FRONTEND ROUTES
        ↓
BACKEND API ROUTES
        ↓
SERVER SERVICES
        ↓
DATABASE / EXTERNAL PROVIDERS
Recommended frontend routes:
/
 /login
 /signup
 /dashboard
 /watchlists
 /watchlists/[id]
 /pulse/[eventId]
 /replay
Recommended API routes:
/api/v1/me

/api/v1/watchlists
/api/v1/watchlists/:id
/api/v1/watchlists/:id/symbols
/api/v1/watchlists/:id/symbols/:symbol

/api/v1/market/quotes
/api/v1/market/history

/api/v1/pulse
/api/v1/pulse/:eventId
/api/v1/pulse/replay

/api/v1/seen
/api/v1/seen/all

/api/v1/health
The exact Next.js route-handler structure may differ.
The responsibility must not.
 
91. ROUTING FLOW
A typical authenticated dashboard request must follow:
Browser
   ↓
/dashboard
   ↓
Authenticated session
   ↓
GET /api/v1/pulse
   ↓
Server verifies session
   ↓
Server derives user ID
   ↓
Load user's active watchlist
   ↓
Load user's last-seen state
   ↓
Load shared market observations
   ↓
Run Pulse Engine
   ↓
Return structured Pulse response
   ↓
Frontend renders UI
Never bypass the backend for core business logic.
 
92. FRONTEND ROUTE PROTECTION
Protected routes:
/dashboard
/watchlists
/watchlists/[id]
/pulse/[eventId]
/replay
must require authentication.
Public routes may include:
/
/login
/signup
If an unauthenticated user attempts to access a protected route:
redirect → /login
Do not render protected user information before authentication is established.
 
93. API RESPONSE RULE
APIs should return structured JSON.
Example:
{
  "data": {...},
  "error": null
}
or an equivalent consistent response convention.
Errors should be predictable.
Example:
400 → invalid request
401 → unauthenticated
403 → unauthorized
404 → resource not found
409 → conflict
422 → validation failure
429 → rate limited
500 → server error
503 → external provider unavailable
Do not expose internal stack traces to the client.
 
94. VALIDATION
Validate all external input on the backend.
Validate:
watchlist IDs
symbol names
timestamps
replay ranges
pagination
query parameters
request bodies
Never assume frontend validation is sufficient.
Frontend validation exists for UX.
Backend validation exists for correctness and security.
 
95. SYMBOL NORMALIZATION
Symbols must be normalized consistently.
For example:
reliance
RELIANCE
Reliance
must not accidentally create three different securities.
The canonical representation must be defined by the selected market-data provider.
Store and query using the canonical symbol.
Provider-specific symbol mappings should live inside the market-data abstraction.
 
96. DATABASE INTEGRITY
Add appropriate:
primary keys
foreign keys
unique constraints
indexes
not-null constraints
At minimum:
watchlists.user_id → users.id

watchlist_items.watchlist_id → watchlists.id

user_symbol_state.user_id → users.id
Prevent duplicate watchlist items.
A user should not accidentally have:
RELIANCE
RELIANCE
RELIANCE
in the same watchlist.
 
97. USER-SYMBOL STATE
Recommended conceptual model:
user_symbol_state
-----------------
id
user_id
symbol
last_seen_timestamp
created_at
updated_at
Add a uniqueness constraint over:
(user_id, symbol)
if the state is intended to be shared across the user's watchlists.
If state is intentionally watchlist-specific, use:
(user_id, watchlist_id, symbol)
and document that decision.
The implementation must choose one model deliberately.
Do not accidentally create ambiguous state semantics.
 
98. INITIAL LAST-SEEN BEHAVIOR
A new user must not receive fabricated historical events.
When a symbol is first added, define an explicit initialization policy.
Recommended:
Add symbol
    ↓
Set initial last_seen_timestamp
    ↓
Use current server time
This means Pulse begins tracking what happens after the user starts watching the symbol.
Do not silently evaluate months of historical movement as if the user had been watching the stock.
Replay remains available for historical exploration.
 
99. LAST-SEEN SEMANTICS
The meaning of last_seen_timestamp must remain precise:
The most recent server-authoritative point through which the user has acknowledged the relevant Pulse information for that symbol.
Do not update last seen merely because:
dashboard loaded
unless that behavior is explicitly chosen.
Viewing and acknowledging are different concepts.
Recommended behavior:
Load Pulse
 ↓
User sees events
 ↓
User explicitly marks seen
 ↓
Server updates state
 
100. CONCURRENT MARK-SEEN SAFETY
If the same user has multiple browser tabs open:
Tab A
Tab B
marking an event seen from either tab must not corrupt state.
The backend must use server-authoritative timestamps and safe database updates.
Never allow an older client timestamp to move state backward.
Example:
Current last_seen = 15:00

Incoming client request claims = 14:30

Result:

last_seen remains 15:00
 
101. TIME HANDLING
Store timestamps in UTC.
Convert to the user's local timezone only for presentation.
Example:
Database:
2026-09-05T09:26:12Z

UI:
14:56:12 IST
Never mix:
server local time
browser local time
market exchange time
UTC
without explicit conversion.
 
102. MARKET CALENDAR
The Pulse Engine must account for market closure.
Do not interpret:
Friday 15:30
→
Monday 09:15
as continuous trading time.
Historical comparison must respect actual observations.
Missing observations during market closure are not automatically data failures.
They may represent:
market closed
 
103. MARKET SESSION AWARENESS
Where supported by the provider, store or infer:
market session
such as:
PRE_MARKET
REGULAR
POST_MARKET
CLOSED
The implementation must not describe a closed-market observation as live trading activity.
If session information is unavailable, use conservative wording.
 
104. HISTORICAL WINDOW SELECTION
For a Pulse request:
referenceTime
evaluationTime
the engine must retrieve enough historical data to establish:
reference observation
+
evaluation observation
+
historical baseline
Do not retrieve only the two endpoint prices.
The analytical baseline requires historical observations.
 
105. BASE INTERVAL
Define one canonical analytical base interval.
Example:
5-minute observations
or:
15-minute observations
The selected interval must be compatible with the market-data provider.
Document the chosen interval in the implementation.
All interval-normalization calculations must reference the same base interval.
 
106. HISTORICAL BASELINE
The baseline should use comparable observations where practical.
For example:
Current 30-minute absence
        ↓
Compare against historical 30-minute movements
rather than blindly comparing it with:
one-minute volatility
The exact statistical method may remain a pragmatic heuristic.
The important requirement is:
Compare like with like.
 
107. ANALYTICS TRANSPARENCY
The engine should return structured analytical facts.
Conceptually:
PulseEvent
{
  symbol
  referenceTime
  evaluationTime

  referencePrice
  evaluationPrice
  return

  expectedMovement
  unusualness

  confidence
  attentionLevel

  volumeSignal

  explanation
}
The frontend should not reconstruct these values independently.
 
108. DETERMINISTIC ANALYTICS
Given identical:
watchlist
referenceTime
evaluationTime
historical observations
configuration
the Pulse Engine should produce the same result.
This is especially important for replay.
Conceptually:
same inputs
    ↓
same engine
    ↓
same output
Do not introduce nondeterministic AI decisions into core ranking.
 
109. ANALYTICS CONFIGURATION
Centralize thresholds.
Example:
PulseConfig

baseInterval
minimumHistory
minimumObservations
confidenceThresholds
attentionThresholds
freshnessThresholds
Do not scatter values throughout:
components/
routes/
services/
utils/
Configuration should be easy to inspect and modify.
 
110. NO MAGIC NUMBERS
Avoid code such as:
if unusualness > 2.73
in arbitrary locations.
Prefer:
pulseConfig.attention.high
or an equivalent centralized configuration.
Every important analytical threshold must have a documented reason.
 
111. CONFIDENCE MODEL
Confidence should reflect the reliability of the underlying evidence.
Inputs may include:
history length
observation count
data continuity
data freshness
volatility stability
provider quality
Confidence must NOT simply equal:
unusualness > X
A very large movement with poor data quality should not automatically become:
HIGH CONFIDENCE
 
112. INSUFFICIENT DATA
If the system cannot reliably determine unusualness:
confidence = INSUFFICIENT
and the explanation should say:
Not enough historical data to determine
whether this movement was unusual.
The system may still show the raw movement.
It must not manufacture a precise unusualness multiplier.
 
113. PARTIAL DATA
If some symbols have insufficient data while others have sufficient data:
Symbol A → HIGH confidence
Symbol B → LIMITED
Symbol C → INSUFFICIENT
Do not fail the entire Pulse response because one symbol lacks history.
Return the strongest valid results and clearly represent limited/insufficient cases.
 
114. ATTENTION RANKING RULE
Rank valid events by the configured attention heuristic.
A possible conceptual ordering:
HIGH ATTENTION
    ↓
IMPORTANT
    ↓
WATCH
    ↓
NORMAL
Within the same category, rank using a deterministic tie-breaker.
Example:
unusualness
↓
confidence
↓
absolute movement
↓
symbol
The exact tie-breaker may differ, but it must be deterministic.
 
115. NORMAL MOVEMENTS
Normal movements should remain available but visually de-emphasized.
Example:
14 other stocks moved normally.
Do not force users to inspect every normal movement.
The product is a compression layer.
 
116. EVENT IDENTITY
Every Pulse event returned by the backend must have a stable identifier for the request/context.
Conceptually:
eventId
symbol
referenceTime
evaluationTime
Do not rely only on array indexes.
Event details must be reconstructible from authoritative backend data.
 
117. EVENT DETAIL SECURITY
When requesting:
GET /api/v1/pulse/:eventId
the backend must verify that the event belongs to the authenticated user's accessible watchlist/context.
Never allow:
User A
 ↓
eventId
 ↓
User B's watchlist data
 
118. REPLAY SECURITY
Replay must use the authenticated user's:
watchlist
and must not allow a client to inject an arbitrary external watchlist.
Correct:
authenticated user
 ↓
user's watchlist
 ↓
selected historical time
 ↓
Pulse Engine
 
119. REPLAY INPUT VALIDATION
Validate:
referenceTime
evaluationTime
Ensure:
referenceTime < evaluationTime
Ensure the requested range is within supported historical data.
Reject unreasonable ranges rather than allowing expensive unrestricted queries.
 
120. REPLAY UX
Replay should clearly communicate that the user is viewing historical analysis.
Example:
REPLAY

September 5, 2026
10:30 AM → 2:30 PM

Historical Pulse
Do not make historical results look like current live alerts.
 
121. REPLAY EXIT
Provide a clear way to return to current Pulse:
← Back to live Pulse
Current/live state must never accidentally be overwritten by replay.
Replay is analysis.
It is not a state mutation.
 
122. REPLAY MUST NOT MARK SEEN
Viewing replay must not automatically update:
last_seen_timestamp
Only explicit user acknowledgement in the live context should update seen state.
 
123. REFRESH BEHAVIOR
Refreshing:
/dashboard
must fetch authoritative server state.
Do not rely on stale frontend memory.
Expected:
Refresh
 ↓
authenticate
 ↓
fetch state
 ↓
fetch Pulse
 ↓
render current truth
 
124. LOGIN RETURN EXPERIENCE
When an existing user logs back in:
Login
 ↓
Restore account
 ↓
Restore watchlist
 ↓
Restore last-seen state
 ↓
Evaluate new observations
 ↓
Show only newly relevant information
This is a core product requirement.
The system must not reset the user's state on login.
 
125. SESSION CONTINUITY
Authentication session and Pulse state are separate concepts.
Logging in again should restore:
identity
watchlist
last_seen
It must not create:
new user
new watchlist
new last_seen
for the same authenticated account.
 
126. FIRST LOGIN EXPERIENCE
New user:
Sign up
 ↓
Welcome
 ↓
Create/select watchlist
 ↓
Add supported symbols
 ↓
Initial last-seen established
 ↓
Begin tracking
Avoid presenting an overwhelming historical Pulse immediately unless the user explicitly enters Replay.
 
127. RETURNING USER EXPERIENCE
Returning user:
Login
 ↓
Dashboard
 ↓
"You were away..."
 ↓
Pulse
This should be the shortest path through the product.
Do not force the returning user through setup screens.
 
128. WATCHLIST EMPTY STATE
If the user has no symbols:
Your watchlist is empty.

Add a few stocks to start seeing
what changed while you were away.
Provide a clear action:
[ Add stocks ]
 
129. NO NEW ACTIVITY STATE
If there are observations but no attention-worthy events:
You're all caught up.

The market moved while you were away,
but nothing in your watchlist moved
unusually enough to surface.
This is a successful product outcome.
 
130. DATA UNAVAILABLE STATE
If current market data is unavailable:
Market data is temporarily unavailable.

We won't guess or fabricate the result.
Please try again.
This wording reinforces trust.
 
131. STALE DATA STATE
If data is available but stale:
Market data may be delayed.

Last updated 8 minutes ago.
Do not use:
LIVE
unless freshness criteria are satisfied.
 
132. PARTIAL PROVIDER FAILURE
If:
17 symbols
are requested and only:
14
succeed:
Do not silently pretend all 17 succeeded.
Return explicit metadata such as:
successfulSymbols
failedSymbols
dataQuality
The UI may communicate:
14 stocks analyzed.

3 couldn't be analyzed because market data
was temporarily unavailable.
 
133. API RATE LIMITING
Market-data providers may impose limits.
The backend should:
avoid duplicate requests
reuse persisted observations
batch requests where supported
cache short-lived quote data where appropriate
Do not call the provider independently for every component render.
 
134. MARKET DATA INGESTION STRATEGY
For hackathon scope, use the simplest reliable mechanism.
Possible approach:
User requests Pulse
        ↓
Check latest persisted observations
        ↓
Refresh required symbols
        ↓
Persist observations
        ↓
Run Pulse
If scheduled ingestion is needed, implement a simple scheduled job.
Do not introduce Kafka or distributed streaming infrastructure.
 
135. SHARED OBSERVATIONS
Market observations are symbol-level data.
Do not duplicate:
RELIANCE price
for every user.
Correct:
market_snapshots
      ↓
shared by all users
User-specific information belongs in:
user_symbol_state
 
136. CACHE RULE
Caching may improve performance, but:
Cache is never the authoritative source of user state.
Authoritative:
PostgreSQL
for persisted user state.
Market-data caching may be used where appropriate.
Never allow stale cache to permanently overwrite newer market observations.
 
137. DATABASE QUERY RULE
Avoid N+1 queries.
For example, do not perform:
for each stock:
    query last seen
where a single query can retrieve the user's states.
Prefer batched queries.
But do not prematurely optimize before correctness is established.
 
138. FRONTEND STATE MANAGEMENT
Use the simplest state mechanism that supports the product.
Avoid introducing a large global state framework unless required.
Server-derived data should remain authoritative.
Local component state is appropriate for:
modal visibility
selected replay time
expanded provenance
loading UI
Do not store authoritative market analytics in local state permanently.
 
139. CLIENT CACHE INVALIDATION
After:
mark seen
the frontend must update or refetch Pulse state.
Avoid displaying:
You're all caught up
while the server still considers events unseen.
The UI should converge quickly to server truth.
 
140. OPTIMISTIC UI
Optimistic updates are permitted for:
mark seen
only if rollback/error handling exists.
If the server rejects the operation:
restore previous state
show error
Do not silently assume success.
 
141. ACCESSIBILITY
Interactive elements must have:
keyboard access
visible focus
meaningful labels
sufficient contrast
Do not rely only on color to communicate:
HIGH
WATCH
NORMAL
Use text/icons in addition to color.
 
142. RESPONSIVE DESIGN
Primary layouts must work on:
desktop
tablet
mobile
Mobile should preserve the central hierarchy:
What happened?
 ↓
How unusual?
 ↓
Why surfaced?
Do not simply shrink a desktop dashboard.
 
143. VISUAL DESIGN PRINCIPLE
Pulse should feel:
calm
precise
trustworthy
financial
modern
restrained
Avoid:
casino-like red/green flashing
excessive gradients
AI gimmicks
unnecessary badges
dense technical terminology
The product should communicate confidence without creating panic.
 
144. ANIMATION RULE
Animations should reinforce state transitions.
Good:
Pulse loading
event expansion
mark seen
replay transition
Avoid:
constant flashing
excessive motion
decorative animations
No animation should delay access to the underlying information.
 
145. CHART RULE
Charts must use real persisted observations.
A chart must not be constructed from:
fake points
interpolated fake movements
hardcoded demo values
If historical resolution is insufficient:
Show available data
rather than inventing points.
 
146. CHART PURPOSE
The chart is explanatory.
It should help the user understand:
reference point
 ↓
movement during absence
 ↓
evaluation point
Do not turn the detail page into a full technical trading terminal.
 
147. DATA PROVENANCE UI
Provenance should remain secondary.
Recommended:
Data details ⓘ
On expansion:
Source
Observed
Received
Freshness
This supports trust without overwhelming the primary experience.
 
148. FINANCIAL SAFETY LANGUAGE
The application must not present Pulse as personalized investment advice.
Avoid:
BUY NOW
SELL NOW
YOU SHOULD BUY
YOU SHOULD SELL
GUARANTEED
Prefer:
Surfaced because...
Unusual movement...
High confidence...
Market context...
 
149. NEWS INTEGRATION RULE
If news is implemented:
Market event
+
Independent news observation
may be shown together.
But do not claim:
Stock fell because of article X
unless a reliable source explicitly establishes causality.
Prefer:
A related company announcement
was published around the same time.
 
150. AI EXPLANATION RULE
If an AI provider is used:
The AI receives structured facts such as:
symbol
movement
expected movement
unusualness
confidence
volume signal
timestamps
The AI does NOT receive authority to invent facts.
The generated explanation must be constrained to those facts.
If AI output fails validation:
fallback → deterministic explanation
The core product must remain functional.
 
151. NO AI DEPENDENCY
The following must work with zero AI availability:
Pulse
ranking
confidence
explanation
mark seen
replay
AI is enhancement only.
 
152. LOGGING
Server logs should support debugging.
Useful:
request ID
route
latency
provider status
database timing
Pulse computation timing
error category
Never log:
API keys
auth secrets
passwords
session tokens
Avoid unnecessary personal data.
 
153. HEALTH CHECK
Provide:
GET /api/v1/health
It should verify application availability.
Where appropriate, expose dependency status such as:
database: healthy
market provider: reachable
Do not expose secrets or sensitive infrastructure information.
 
154. FAILURE IS EXPLICIT
Never convert failures into fake success.
Bad:
Provider unavailable
 ↓
show old fake quote
Good:
Provider unavailable
 ↓
show honest unavailable state
The product's trust model is more important than making every screen look populated.
 
155. MIGRATION RULE
Database schema changes must be represented through migrations.
Do not manually modify production schema without recording the migration.
Before deployment:
migration succeeds
schema matches application expectations
 
156. SEED DATA RULE
Production/demo environments must not depend on fake seed market data.
If seed data is needed for application setup:
users
watchlist structure
configuration
may be seeded.
Market observations must be:
real provider observations
or:
real persisted historical observations
 
157. TEST ENVIRONMENT
Tests may use fixtures.
Clearly separate:
test fixtures
from:
production services
Ensure test fixtures cannot accidentally be imported into production runtime paths.
 
158. TYPE SAFETY
Use TypeScript throughout the application where practical.
Avoid excessive:
any
for core domain models.
Define shared types for:
User
Watchlist
Symbol
MarketSnapshot
PulseEvent
PulseResponse
ReplayRequest
Confidence
AttentionLevel
 
159. DOMAIN MODEL
Core domain objects should remain conceptually stable.
User
Watchlist
Symbol
MarketSnapshot
UserSymbolState
PulseEvent
PulseResult
Keep domain logic independent from UI components.
 
160. SERVICE BOUNDARIES
Recommended internal services:
AuthService
UserService
WatchlistService
MarketDataService
SnapshotService
PulseService
ReplayService
SeenService
These can live in a single application.
This is modularity, not microservices.
 
161. PULSE SERVICE
PulseService should orchestrate.
Conceptually:
PulseService
    ↓
load watchlist
    ↓
load last seen
    ↓
load observations
    ↓
PulseEngine
    ↓
rank
    ↓
explain
    ↓
return
The service should not contain dozens of unrelated calculations.
 
162. PULSE ENGINE PURENESS
Where practical, the core analytical engine should be close to a pure function:
PulseEngine.calculate(input)
with:
input
 ↓
output
and no direct:
database calls
HTTP calls
browser APIs
This makes:
unit testing
replay
debugging
determinism
much easier.
 
163. EXPLANATION GENERATION
Deterministic fallback explanation should always exist.
Example structure:
{SYMBOL} moved {RETURN} since you last checked.

That movement was approximately {MULTIPLIER}×
its expected movement over a comparable interval.

Why was this surfaced?

The movement was significantly larger than
its typical behavior for a comparable interval.
Values must be dynamically generated.
 
164. ATTENTION COUNT
The summary must be generated from actual classified events.
Conceptually:
movedCount =
count(events with meaningful movement)

attentionCount =
count(events above configured attention threshold)
Do not infer:
attentionCount = min(3, movedCount)
unless that is explicitly the product configuration.
The ranking system determines the result.
 
165. MOVEMENT COUNT
Define "moved" precisely.
It must not mean:
any microscopic price tick
Use a configurable meaningful-movement criterion appropriate to the available data.
Document the threshold and rationale.
 
166. EVENT DEDUPLICATION
Multiple observations of the same security during the absence must not create meaningless duplicate events.
Prefer:
one summarized event per symbol
representing the movement over the user's evaluation interval.
Historical detail remains available through the chart.
 
167. EVENT EXPLANATION CONSISTENCY
The summary card and detail page must describe the same underlying event.
Do not show:
Dashboard:
-4.8%

Detail:
-3.9%
unless the two values intentionally represent different clearly labeled intervals.
All event data should derive from the same backend event model.
 
168. PULSE SNAPSHOT CONSISTENCY
A Pulse request should operate against a coherent evaluation point.
Avoid calculating:
Symbol A at 14:55
Symbol B at 15:02
Symbol C at 15:11
while describing them as though evaluated at one identical instant, unless unavoidable due to provider limitations.
Capture an evaluation timestamp and communicate freshness appropriately.
 
169. IDEMPOTENCY
Where appropriate, state-changing requests should be safe against accidental duplicate submissions.
Particularly:
mark seen
mark all seen
Repeating the operation should not corrupt state.
 
170. DELETE SAFETY
Removing a symbol from a watchlist must not delete shared market observations.
Correct:
remove from user's watchlist
while retaining:
shared market history
if that history may be useful to other users or future analysis.
 
171. USER DATA ISOLATION TEST
Explicitly test:
User A
 ↓
cannot access
 ↓
User B's watchlist
User B's last seen
User B's Pulse events
This is mandatory.
 
172. PROVIDER ABSTRACTION TEST
The Pulse Engine must operate on normalized market observations.
It should not depend on:
Twelve Data response shape
or another provider's raw JSON.
Correct:
Provider
 ↓
normalize
 ↓
MarketSnapshot
 ↓
Pulse Engine
This allows provider replacement without rewriting analytics.
 
173. PROVIDER SWITCHABILITY
If the initial market-data provider becomes unavailable or unsuitable:
The system should allow another provider to implement:
MarketDataProvider
without rewriting:
PulseEngine
Frontend
LastSeen
Replay
 
174. THIRD-PARTY API INVENTORY
Keep a documented list of external dependencies.
At minimum:
Authentication provider
Market-data provider
Database hosting/provider
Deployment provider
Optional:
News provider
AI provider
For each external service document:
purpose
required environment variables
rate limits
failure behavior
 
175. API KEY SECURITY
Provider keys must exist only server-side.
Never expose:
MARKET_DATA_API_KEY
to the browser.
Do not prefix server-only secrets with client-exposed environment conventions.
Never include secrets in:
Git
logs
error messages
API responses
frontend bundles
 
176. RATE-LIMIT FALLBACK
If the market-data provider responds with rate limiting:
429
the application must not repeatedly hammer the provider.
Use:
retry/backoff where appropriate
cached/persisted observations where valid
clear unavailable state
 
177. NETWORK TIMEOUTS
External API calls must have reasonable timeouts.
A provider that hangs indefinitely must not freeze the entire application.
On timeout:
provider timeout
 ↓
structured error
 ↓
honest UI state
 
178. DATABASE FAILURE
If PostgreSQL is unavailable:
Do not fabricate:
watchlist
last seen
Pulse
Show an explicit recoverable error.
 
179. AUTH PROVIDER FAILURE
If authentication cannot be verified:
Do not fall back to:
guest user
for protected functionality.
Fail closed.
 
180. ACCEPTANCE TEST MATRIX
Before final release, verify each core subsystem independently.
Area	Required
Signup	Yes
Login	Yes
Logout	Yes
Session persistence	Yes
Watchlist persistence	Yes
Symbol add/remove	Yes
Real market data	Yes
Historical observations	Yes
Last seen	Yes
Pulse engine	Yes
Confidence	Yes
Ranking	Yes
Explanation	Yes
Mark seen	Yes
Mark all seen	Yes
Replay	Yes
Authorization	Yes
Error states	Yes
Stale states	Yes
Provenance	Yes
Responsive UI	Yes
 
181. CRITICAL USER JOURNEY
This is the single most important end-to-end test:
SIGN UP
   ↓
LOGIN
   ↓
CREATE WATCHLIST
   ↓
ADD REAL STOCKS
   ↓
FETCH REAL DATA
   ↓
ESTABLISH LAST SEEN
   ↓
WAIT / USE HISTORICAL REFERENCE
   ↓
RETURN
   ↓
PULSE
   ↓
N MOVED
M DESERVE ATTENTION
   ↓
OPEN EVENT
   ↓
UNDERSTAND WHY
   ↓
CHECK CONFIDENCE
   ↓
CHECK PROVENANCE
   ↓
MARK SEEN
   ↓
REFRESH
   ↓
EVENT IS NO LONGER UNSEEN
   ↓
LOG OUT
   ↓
LOG IN AGAIN
   ↓
STATE REMAINS
   ↓
REPLAY
   ↓
SAME ENGINE
This journey must work before optional features are considered complete.
 
182. REPLAY DEMO TEST
Use real persisted observations.
Test:
Choose replay reference time A
 ↓
Run Pulse
 ↓
Record result

Choose replay reference time B
 ↓
Run Pulse
 ↓
Compare
The analytical window must actually change.
The result may be:
different
or:
similar
depending on real data.
The important requirement is that the engine actually uses the selected times.
 
183. NO-ALERT DEMO TEST
The application must support a real scenario where:
stocks moved
but:
nothing was sufficiently unusual
The UI should communicate:
You're all caught up.
This demonstrates that Pulse is a noise filter rather than a notification generator.
 
184. INSUFFICIENT-HISTORY DEMO TEST
Create or identify a real supported symbol with insufficient historical observations.
Verify:
Movement available
+
Unusualness unavailable
+
Confidence insufficient
UI:
Not enough historical data to determine
whether this movement was unusual.
No fake multiplier.
 
185. STALE-DATA DEMO TEST
Simulate provider/data freshness conditions in a test environment.
Verify:
stale data
 ↓
stale UI
Never:
stale data
 ↓
LIVE badge
 
186. PROVIDER FAILURE TEST
Simulate:
timeout
429
500
invalid provider response
Verify:
no fabricated market values
no fake Pulse
clear error
recoverable UI
 
187. AUTHORIZATION TEST
Explicitly test:
User A token
+
User B watchlist ID
Expected:
403 or 404
Never:
User B data returned
 
188. LAST-SEEN PERSISTENCE TEST
Test:
User A
 ↓
mark seen
 ↓
logout
 ↓
login
 ↓
Pulse
Expected:
previously acknowledged information remains acknowledged
This is mandatory.
 
189. FRONTEND/BACKEND CONTRACT TEST
Verify that frontend and backend agree on:
request shape
response shape
error shape
timestamps
enum values
event IDs
Avoid silently accepting incompatible response structures.
 
190. DEPLOYMENT CONFIGURATION
Production deployment must include:
DATABASE_URL
AUTH configuration
MARKET_DATA_API_KEY
other required provider configuration
All secrets must be configured through the hosting environment.
.env.example must document required variables without values.
 
191. PRODUCTION BUILD
Before final demo:
npm run build
or equivalent must succeed.
Also run:
lint
typecheck
unit tests
integration tests
critical E2E
No known critical failures may remain.
 
192. BROWSER VERIFICATION
Test the deployed application in at least:
desktop Chromium-based browser
mobile-sized viewport
Verify:
login
dashboard
event detail
mark seen
replay
 
193. CONSOLE CLEANLINESS
The final demo should have no recurring critical:
JavaScript exceptions
failed API requests
hydration errors
broken asset requests
Expected provider failures must be handled rather than producing uncontrolled browser errors.
 
194. NETWORK VERIFICATION
Inspect the browser network flow.
Confirm:
Frontend
 ↓
your backend API
and not:
Frontend
 ↓
market provider with secret key
Verify authenticated requests carry the expected session mechanism.
 
195. FINAL SECURITY CHECK
Before submission:
[ ] No secrets in Git
[ ] No secrets in client bundle
[ ] Auth required for protected APIs
[ ] User ID derived server-side
[ ] Watchlist ownership enforced
[ ] Event ownership enforced
[ ] Replay scoped to user
[ ] Input validated
[ ] Provider keys server-side
[ ] Sensitive logs removed
 
196. FINAL DATA INTEGRITY CHECK
Verify:
[ ] Prices are real
[ ] Timestamps are real
[ ] Historical data is real
[ ] Source timestamp is preserved
[ ] Receive timestamp is preserved
[ ] Older observations cannot overwrite newer ones
[ ] Analytics use persisted observations
[ ] Replay uses persisted observations
[ ] No fake production fixtures
 
197. FINAL PRODUCT CHECK
Ask:
If I open this application for the first time, do I immediately understand what I missed?
Then:
Can I understand why a particular event was surfaced?
Then:
Can I trust the data?
Then:
Can I mark it seen?
Then:
If I leave and return, does the product remember where I left off?
Then:
Can I replay the same experience historically?
If the answer to all six is yes:
The product thesis has been successfully implemented.
 
198. WHAT NOT TO BUILD
Unless explicitly approved, do NOT add:
portfolio management
broker integration
order execution
buy/sell recommendations
price prediction
social feed
chatbot
complex AI agents
technical-analysis terminal
crypto dashboard
options analytics
derivatives trading
Kubernetes
Kafka
microservices
vector database
complex event bus
These dilute the product.
 
199. WHAT TO CUT FIRST IF TIME RUNS OUT
If the deadline approaches, cut in this order:
1. AI wording
2. News/context
3. Advanced realtime behavior
4. Advanced chart interactions
5. Decorative animations
6. Nonessential watchlist features
Never cut:
Authentication
Real market data
Historical observations
Last seen
Pulse Engine
Confidence
Ranking
Explanation
Mark seen
Replay
 
200. FINAL DEFINITION OF DONE
Groww Pulse is DONE only when:
AUTHENTICATION
      ✓
      ↓
PERSONAL WATCHLIST
      ✓
      ↓
REAL MARKET DATA
      ✓
      ↓
PERSISTED HISTORICAL OBSERVATIONS
      ✓
      ↓
PERSONAL LAST-SEEN STATE
      ✓
      ↓
PULSE ANALYTICS
      ✓
      ↓
CONFIDENCE / DATA QUALITY
      ✓
      ↓
ATTENTION RANKING
      ✓
      ↓
EXPLAINABLE PULSE
      ✓
      ↓
EVENT DETAIL
      ✓
      ↓
MARK SEEN
      ✓
      ↓
PERSISTED RETURN STATE
      ✓
      ↓
HISTORICAL REPLAY
      ✓
      ↓
PRODUCTION DEPLOYMENT
      ✓
All critical acceptance tests must pass.
 
201. FINAL PRODUCT STATEMENT
The product is:
Pulse — You were away. Here's what matters.
The product does not attempt to predict the market.
It does not attempt to tell the user what investment decision to make.
It answers one focused question:
What changed in my watchlist since I last looked, what was unusual, and why was it surfaced?
The core loop remains:
LAST SEEN
    ↓
WHAT CHANGED
    ↓
WAS IT UNUSUAL
    ↓
CAN WE TRUST IT
    ↓
WHY WAS IT SURFACED
    ↓
MARK SEEN
    ↓
PERSIST STATE
    ↓
RETURN LATER
    ↓
ONLY NEW INFORMATION
 
202. FINAL ARCHITECTURE
The final hackathon architecture is intentionally simple:
                         ┌────────────────────┐
                         │  Authentication     │
                         │  Provider           │
                         └─────────┬──────────┘
                                   │
                                   ▼
┌──────────────────┐      ┌────────────────────┐
│                  │      │                    │
│  Next.js / React │─────▶│   Pulse API        │
│  Frontend        │◀─────│   /api/v1          │
│                  │      │                    │
└────────┬─────────┘      └─────────┬──────────┘
         │                          │
         │                          ▼
         │                ┌────────────────────┐
         │                │                    │
         │                │   Application      │
         │                │   Services         │
         │                │                    │
         │                │ Auth               │
         │                │ Watchlists         │
         │                │ Market Data        │
         │                │ Pulse              │
         │                │ Replay             │
         │                │ Seen               │
         │                │                    │
         │                └─────────┬──────────┘
         │                          │
         │                          ▼
         │                ┌────────────────────┐
         │                │                    │
         │                │   Pulse Engine     │
         │                │                    │
         │                │ Return             │
         │                │ Volatility         │
         │                │ Unusualness        │
         │                │ Confidence         │
         │                │ Attention          │
         │                │ Ranking             │
         │                │ Explanation        │
         │                │                    │
         │                └─────────┬──────────┘
         │                          │
         │                ┌─────────┴─────────┐
         │                ▼                   ▼
         │       ┌────────────────┐   ┌────────────────┐
         │       │  PostgreSQL    │   │ Market Data    │
         │       │                │   │ Provider       │
         │       │ Users          │   │                │
         │       │ Watchlists     │   │ Quotes         │
         │       │ Snapshots      │   │ Historical     │
         │       │ Last Seen      │   │ Data           │
         │       └────────────────┘   └────────────────┘
         │
         ▼
┌──────────────────────┐
│ Lightweight Charts   │
│ Real historical data │
└──────────────────────┘
 
203. FINAL ENGINEERING PRINCIPLE
If there is ever a choice between:
MORE TECHNOLOGY
and:
MORE RELIABLE PULSE
choose:
MORE RELIABLE PULSE
If there is ever a choice between:
MORE FEATURES
and:
BETTER LAST-SEEN → PULSE → MARK-SEEN LOOP
choose:
BETTER CORE LOOP
If there is ever a choice between:
PRETTY FAKE DEMO
and:
HONEST REAL DATA
choose:
HONEST REAL DATA
If there is ever a choice between:
COMPLEX ARCHITECTURE
and:
SIMPLE ARCHITECTURE THAT WORKS
choose:
SIMPLE ARCHITECTURE THAT WORKS
 
204. FINAL AGENT COMMAND
Build the product in phases.
Do not skip acceptance gates.
Do not fabricate data.
Do not invent analytics.
Do not bypass authentication.
Do not trust client-owned identity.
Do not duplicate the Pulse Engine.
Do not create a fake replay mode.
Do not expand the product thesis.
Do not optimize for feature count.
Optimize for this:
LAST SEEN → WHAT CHANGED → WAS IT UNUSUAL → CAN WE TRUST IT → WHY WAS IT SURFACED → MARK SEEN
When that loop works reliably with real data, persistent users, historical replay, and a polished interface:
Groww Pulse is ready.
This version is now a much stronger implementation contract because it closes the gaps around login persistence, frontend/backend routing, authorization, timestamps, replay semantics, provider failures, and the exact meaning of last_seen.
Most importantly, yes — when the user logs back in, they continue from where they left off. The identity comes from the auth provider, while the watchlist and last_seen_timestamp come from PostgreSQL. So logging out does not reset their Pulse state.


