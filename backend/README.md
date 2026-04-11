# Aegis Backend (Node + Express + MySQL)

## Folder Structure

```
backend/
  app.js
  package.json
  .env.example
  config/
    db.js
  middleware/
    auth.js
  controllers/
    authController.js
    eventController.js
    policyController.js
    payoutController.js
    riskController.js
  services/
    weatherService.js
    aqiService.js
  jobs/
    cronJob.js
  models/
    userModel.js
    policyModel.js
    eventModel.js
    payoutModel.js
  routes/
    authRoutes.js
    policyRoutes.js
    eventRoutes.js
    payoutRoutes.js
    riskRoutes.js
  sql/
    schema.sql
    seed.sql
```

## Setup

1. Install dependencies:
   - `cd backend`
   - `npm install`
2. Configure environment:
   - Copy `.env.example` to `.env`
   - Update DB, JWT and external API keys
3. Create schema and seed data:
   - Run `sql/schema.sql` on your MySQL DB
   - Run `sql/seed.sql` on your MySQL DB
4. Start server:
   - `npm run dev` or `npm start`

## Main APIs

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/policies` (auth)
- `GET /api/policies/me` (auth)
- `GET /api/events/fetch-environment/:city`
- `GET /api/events/:city`
- `POST /api/events/simulate-event`
- `POST /api/payouts/run-payout` (auth)
- `GET /api/payouts/wallet` (auth)
- `GET /api/risk-score/:city`

## External Data Engine

- `GET /api/events/fetch-environment/:city`
  - Calls OpenWeather + AQICN
  - Extracts rainfall, temperature, weather condition, AQI, pollution level
  - Stores data into `events` table with trigger status
- Trigger logic:
  - `triggered = true` when `rainfall > 50 OR aqi > 300`
- `GET /api/events/:city`
  - Returns latest stored event for city
- `POST /api/events/simulate-event`
  - Demo endpoint to force trigger for custom city/rainfall/aqi input

## Cron Automation

- Hourly cron is enabled via `node-cron` (every hour at minute 0).
- Reads cities from `PREDEFINED_CITIES` in `.env`.
- For each city, fetches external data and stores an event row.
- Errors are logged and handled per city without stopping the whole job.

## Payout Logic

- Event is triggered when `rainfall > 50` OR `aqi > 300`.
- `/api/payouts/run-payout` accepts `{ "event_id": <id> }`.
- For each user in event city with active policy:
  - `payout = weekly_income * coverage_percentage / 100`
  - payout record is stored.
- Fraud flags:
  - no active policy
  - duplicate payout for the same event

## Logging

- Event creation logs in console with `[EVENT]`.
- Payout execution logs in console with `[PAYOUT]`.
