Build a production-grade web application called “RING SENTINEL” — a real-time payment/transaction intelligence and fraud-risk monitoring platform for analysts.

IMPORTANT:
This is NOT a static UI mockup.
Do NOT use mock data, fake transactions, hardcoded transaction lists, random generated values, seeded demo data, placeholder analytics, or simulated “live” activity.

The product must be architected around REAL incoming transaction/event data.

If a live backend/API is not yet connected, build the application so that it clearly shows an “Awaiting Live Data / Backend Connection” state rather than inventing data. Every metric, transaction, alert, graph, and risk score must ultimately come from an actual data source.

==================================================
CORE PRODUCT
==================================================

RING SENTINEL continuously analyzes real payment/financial events and helps an analyst identify suspicious transaction patterns.

The core workflow is:

REAL TRANSACTION/EVENT
        ↓
REAL-TIME INGESTION
        ↓
NORMALIZATION
        ↓
RISK / ANOMALY ENGINE
        ↓
RISK SCORE
        ↓
EXPLAINABLE EVIDENCE
        ↓
ANALYST DASHBOARD
        ↓
ALERT / INVESTIGATION

The product should feel like something a bank, payment processor, fintech, or fraud operations team could actually deploy.

==================================================
DESIGN DIRECTION
==================================================

Create a premium enterprise cybersecurity + fintech interface.

Visual character:
- Dark professional analyst environment
- High information density without looking cluttered
- Modern fintech aesthetics
- Subtle glass/solid panels
- Strong typography hierarchy
- Minimal decorative elements
- No unnecessary gradients
- No cartoon illustrations
- No generic AI robot imagery
- No excessive neon
- Make it look trustworthy and mission-critical

Primary visual hierarchy:
1. Critical alerts
2. Current system/risk state
3. Suspicious transactions
4. Evidence/explanation
5. Network/entity relationships
6. Historical trends

Use clear status indicators:
- Critical
- High
- Medium
- Low
- Normal
- Investigating
- Resolved

==================================================
MAIN SCREEN — ANALYST COMMAND CENTER
==================================================

Create a desktop-first analyst dashboard.

Header:

RING SENTINEL
Real-Time Transaction Intelligence

Right side:
- Live connection status
- Last event timestamp
- Analyst profile
- Settings

IMPORTANT:
The connection indicator must reflect the actual backend/data connection.

Possible states:
● LIVE
○ CONNECTING
× OFFLINE

Never display LIVE unless the application is actually receiving live events.

--------------------------------------------------
TOP SUMMARY AREA
--------------------------------------------------

Create KPI cards for:

- Events received
- Transactions analyzed
- High-risk events
- Critical alerts
- Active investigations
- Detection latency

Each KPI must be connected to the real data layer.

Do not insert fake numbers.

If no live data exists:
show:

“Waiting for live transaction stream”

instead of:
0, 1245, 83%, etc.

--------------------------------------------------
REAL-TIME EVENT STREAM
--------------------------------------------------

Create a large transaction/event table.

Columns:

Timestamp
Transaction ID
Sender
Receiver
Amount
Currency
Channel
Location
Device
Risk Score
Risk Level
Detection Reason
Status

The table must support:

- Real-time insertion of new events
- Sorting
- Filtering
- Search
- Risk-level filtering
- Time filtering
- Transaction ID search
- Entity search
- Pause/resume stream
- Open investigation

Do not populate this table with fake rows.

--------------------------------------------------
LIVE RISK ACTIVITY
--------------------------------------------------

Create a real-time visualization showing incoming risk events.

Possible visualization:

Risk score over time.

Display:
- X-axis = timestamp
- Y-axis = risk score
- Highlight high-risk events
- Clicking an event opens the investigation panel

The visualization must update when real events arrive.

Do not animate fake events simply to make the dashboard appear alive.

--------------------------------------------------
THREAT / RISK DISTRIBUTION
--------------------------------------------------

Create an analyst visualization showing the distribution of actual detected events:

Critical
High
Medium
Low
Normal

The visualization must be dynamically derived from incoming data.

If there is insufficient data, clearly display:

“Insufficient live data for analysis.”

==================================================
INVESTIGATION VIEW
==================================================

When an analyst selects a suspicious transaction, open a detailed investigation screen/panel.

Show:

Transaction ID
Timestamp
Amount
Sender
Receiver
Account age
Device information
Location
Payment channel
Transaction history
Risk score
Risk level

Then show:

WHY WAS THIS FLAGGED?

This is one of the most important parts of the product.

Do not merely say:

“AI detected suspicious activity.”

Instead display explainable evidence such as:

- Unusual transaction velocity
- New device
- Geographic inconsistency
- Abnormal transaction amount
- Unusual recipient relationship
- Rapid movement of funds
- Multiple entities connected to the same device
- Behavior deviates from historical baseline

Only show reasons that are actually produced by the detection engine.

Each reason should contain:
- Evidence
- Severity
- Contribution to risk
- Timestamp where relevant

==================================================
ENTITY / TRANSACTION GRAPH
==================================================

Create an investigation graph.

Nodes:
- Customer
- Account
- Device
- Merchant
- Bank/payment endpoint
- Transaction

Edges:
- Sent
- Received
- Used device
- Paid merchant
- Shared device
- Shared account relationship

When an analyst selects an entity, highlight connected entities.

The graph should help detect patterns such as:

ONE DEVICE
   ↓
MULTIPLE ACCOUNTS
   ↓
MULTIPLE RECIPIENTS

or

MANY SENDERS
   ↓
ONE RECEIVER
   ↓
RAPID FUND MOVEMENT

The graph must eventually be populated from real relationship data.

If there is no data:
show an empty-state explanation rather than fabricated nodes.

==================================================
RISK ENGINE PANEL
==================================================

Create a panel explaining how the risk score was calculated.

Example structure:

RISK SCORE
[actual score from engine]

Contributing signals:

Velocity anomaly       + actual contribution
Device anomaly         + actual contribution
Location anomaly       + actual contribution
Amount anomaly         + actual contribution
Network anomaly        + actual contribution

Total:
actual engine result

Do NOT hardcode these values.

The UI should consume the risk-engine response.

==================================================
ALERT CENTER
==================================================

Create an alert management page.

Each alert should contain:

Alert ID
Created time
Severity
Entity
Trigger
Risk score
Assigned analyst
Status

Actions:

Investigate
Assign
Mark investigating
Resolve
Escalate

Create filters:

All
Critical
High
Medium
Investigating
Resolved

No fake alerts.

==================================================
INVESTIGATION TIMELINE
==================================================

For each case, provide a chronological timeline:

Transaction occurred
↓
Detection triggered
↓
Risk score generated
↓
Evidence collected
↓
Analyst opened case
↓
Analyst action
↓
Resolution

Timeline events must originate from actual application events.

==================================================
REAL-TIME ARCHITECTURE
==================================================

Design the frontend around a clean service/data layer.

Create a structure conceptually similar to:

/services
    transactionService
    riskService
    alertService
    investigationService
    websocketService

The frontend must NOT directly hardcode transaction objects.

Support a real-time transport such as:

WebSocket
or
Server-Sent Events

with REST APIs for historical queries and investigation details.

Example conceptual endpoints:

GET /transactions
GET /transactions/:id
GET /alerts
GET /investigations/:id
GET /metrics
GET /risk/:transactionId

Real-time:

WS /events

The exact endpoint names can be adapted to the actual backend.

==================================================
NO-MOCK-DATA POLICY
==================================================

This is extremely important.

Never do any of the following:

- mockTransactions[]
- fakeAlerts[]
- dummyMetrics
- random risk scores
- Math.random()
- hardcoded transaction rows
- fake timestamps
- fake “LIVE” status
- simulated WebSocket messages
- fake charts
- fake network graphs

If backend connectivity is unavailable:

Display:

RING SENTINEL
Waiting for live event stream

Connection:
OFFLINE

No transaction data available.

[Retry Connection]

The UI should still remain fully functional, but it must never pretend that nonexistent data is real.

==================================================
ERROR / EMPTY / LOADING STATES
==================================================

Design proper states for:

1. Connecting
2. Live
3. Offline
4. Authentication failure
5. API failure
6. No events received
7. Insufficient data
8. Backend timeout

Make these states visually polished.

==================================================
ANALYST UX
==================================================

The analyst should be able to:

- Search transaction
- Search customer/account/device
- Filter risk
- Open suspicious transaction
- Understand WHY it was flagged
- Inspect connected entities
- Review timeline
- Assign investigation
- Escalate
- Resolve case

Minimize clicks.

The goal is:

DETECT → UNDERSTAND → INVESTIGATE → ACT

==================================================
SECURITY / TRUST
==================================================

Include:

- Role-based analyst interface
- Session indicator
- Audit trail
- Clear source timestamps
- Data freshness indicator
- API connection status
- No fabricated information

Every important decision should be traceable to evidence.

==================================================
RESPONSIVE DESIGN
==================================================

Primary target:
1440px desktop analyst workstation.

Also support:
1280px
1024px
mobile/tablet gracefully

Desktop should receive the most attention.

==================================================
IMPORTANT PRODUCT PRINCIPLE
==================================================

Do NOT optimize this application to “look impressive” by filling it with fake numbers.

Optimize it to demonstrate:

REAL DATA
+
REAL-TIME PROCESSING
+
EXPLAINABLE DETECTION
+
INVESTIGATION
+
ACTION

The dashboard should look empty rather than fake when no real data is connected.

==================================================
FINAL QUALITY BAR
==================================================

The final application should feel like:

“An actual fraud/security operations product used by a professional analyst.”

It should NOT feel like:

“A hackathon dashboard with fake transactions.”

Prioritize:
- correctness
- explainability
- real-time architecture
- analyst workflow
- evidence
- usability
- trustworthy states
- clean enterprise design

Build the complete frontend experience and the integration-ready data architecture without inventing any data.