# Architecture Diagram

```mermaid
flowchart TD
    user["User (Web/PWA)"]
    ui["Frontend (React + Vite + TS)\nTailwind · Zustand · Leaflet"]
    api["Backend API (Node + Express + TS)\nControllers · Services · Routing"]
    db["SQLite (Drizzle ORM)\nLines · Stations · Connections · Schedules"]

    user -->|HTTPS| ui
    ui -->|REST / JSON| api
    api -->|SQL| db

    subgraph Observability & Ops
      logs["Logs / Metrics (future)"]
    end

    api -.-> logs
```

This diagram mirrors the multi-city setup: the frontend renders routing and live-status views, the API handles geospatial and routing logic, and SQLite (via Drizzle) stores lines, stations, connections, and schedules. The observability box is noted for future rollout when moving to heavier infra (e.g., Redis, Postgres, APM).