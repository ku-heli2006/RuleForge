# RuleForge Full Stack

This folder combines the supplied React frontend with the RuleForge Spring Boot backend. The integrated frontend uses the live API; Demo Mode is disabled by default.

## Run the complete app (recommended)

1. Install and start Docker Desktop with its Linux container engine.
2. Extract the ZIP so that `docker-compose.yml` is directly in the folder you open (not one level above or below it). Open PowerShell in that folder.
3. Run:

   ```powershell
   docker compose up --build
   ```

   The first run downloads build images and dependencies and may take several minutes. Leave this window open while using the app.
4. Open **http://localhost:5173**. The frontend sends `/api/v1` requests through its local web server to the backend. The backend API is also available at **http://localhost:8080/api/v1** and Swagger UI at **http://localhost:8080/swagger-ui.html**.
5. Stop the app with `Ctrl+C`. To start it again, run `docker compose up` from this folder.

The database is persisted in a Docker volume named `ruleforge-postgres`. To stop and remove containers while keeping data, run `docker compose down`. To also erase the local database, run `docker compose down -v`.

## Run frontend and backend separately

The full stack command above is the easiest option. For manual frontend development, start PostgreSQL and the backend first (the backend requires PostgreSQL):

```powershell
docker compose up postgres -d
cd backend
`$env:DATABASE_URL = 'jdbc:postgresql://localhost:5432/ruleforge'
`$env:DATABASE_USERNAME = 'ruleforge'
`$env:DATABASE_PASSWORD = 'ruleforge'
.\mvnw.cmd spring-boot:run
```

In a second PowerShell window:

```powershell
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173**. The included `frontend/.env` points to the local backend and has `VITE_DEMO_MODE=false`.

## Requirements and included demo data

- Docker Desktop (recommended one-command setup), or Java 21, Node.js 22+, npm, and Docker for PostgreSQL if running separately.
- The backend applies its database migration and seeds an example ecommerce ruleset when the database is empty.
- Local development defaults use the password `ruleforge`. Change `DATABASE_PASSWORD` before using anything beyond a local demo.

See `backend/README.md` for API examples and implementation scope. See `frontend/README.md` for frontend details.
