# RuleForge Backend

Java 21 and Spring Boot REST API for the supplied React frontend. The API base URL is `http://localhost:8080/api/v1`. The current implementation includes typed rule parsing and evaluation, ruleset draft/version storage in PostgreSQL, Z3 verification, counterfactual search, and synthetic backtesting.

## Prerequisites

- JDK 21.
- Maven 3.6.3 or newer (or use the included Maven Wrapper).
- Docker Desktop with its Linux container engine running for the one-command local setup.
- Z3's Java bindings and native runtime are resolved through `tools.aqua:z3-turnkey:4.13.4`; the library loads its platform native code at runtime.

## Start locally

From this directory:

```powershell
docker compose -f compose.yml up --build
```

The Compose setup is configured to start PostgreSQL 17, apply Flyway migrations, seed a synthetic `rs-ecommerce-discounts` ruleset with published versions `1.0.0` through `1.2.0`, and run the API on port 8080. The Swagger UI is at `http://localhost:8080/swagger-ui.html`. Docker Compose configuration was validated, but the container stack and live HTTP endpoints could not be exercised in this session because the Docker Engine was unavailable.

To run the Java app directly, first start only Postgres with `docker compose -f compose.yml up postgres -d`, set the variables below, then run `./mvnw spring-boot:run` (PowerShell: `.\mvnw.cmd spring-boot:run`). The frontend can use `VITE_API_BASE_URL=http://localhost:8080/api/v1` and disable Demo Mode in Settings.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | HTTP listener port |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/ruleforge` | PostgreSQL JDBC URL |
| `DATABASE_USERNAME` | `ruleforge` | Database user |
| `DATABASE_PASSWORD` | `ruleforge` | Local development password; set a private value outside local demos |

## Example requests

```powershell
curl.exe http://localhost:8080/api/v1/health
curl.exe http://localhost:8080/api/v1/rulesets
```

Evaluate an immutable version:

```powershell
curl.exe -X POST http://localhost:8080/api/v1/rulesets/rs-ecommerce-discounts/evaluate `
  -H "Content-Type: application/json" `
  -d '{"version":"1.2.0","input":{"customerTier":"GOLD","orderAmount":6000,"creditScore":720,"customerAge":25,"region":"US_EAST","isFirstOrder":true}}'
```

Verify rules:

```powershell
curl.exe -X POST http://localhost:8080/api/v1/rulesets/rs-ecommerce-discounts/verify `
  -H "Content-Type: application/json" `
  -d '{"version":"1.2.0","options":{"checkOverlap":true,"checkConflict":true,"checkUnreachable":true,"checkShadowed":true,"solverTimeoutMs":3000}}'
```

## Tests

```powershell
.\mvnw.cmd test
```

Tests cover DSL evaluation, priority conflicts, canonical hashing, Z3 witnesses/reachability, counterfactual target satisfaction, and deterministic self-backtests. Database migration and HTTP integration tests, solver brute-force cross-checks, and JMH benchmarks remain to be added. Do not infer production scale from the synthetic demo.

## Semantics and limitations

- Smaller numeric priority values win, matching the frontend sample rules (priority 1 is strongest). Different fields can come from different matching rules. Incompatible equal-priority assignments are errors. Tags combine as a sorted set and reason messages are included in the explanation list.
- Order amounts are `BigDecimal` with two decimal places; Z3 encodes cents as bounded integers. Region values are validated identifier-like strings. The verifier assigns distinct integer codes to region literals present in the ruleset. It does not encode relational assumptions such as a maximum order size based on customer age.
- Counterfactual search enumerates rule-threshold equivalence representatives with a 300,000 evaluation cap. It proves optimality only when the full representative space is exhausted. Its normalized distance weights are documented in `docs/counterfactual-algorithm.md`.
- Backtesting currently supports the deterministic synthetic `ds-q3-prod-historical` dataset (500 records) only. `estimatedFinancialImpact` is the difference in modeled discount payout, not profit. The job is synchronous and CSV includes changed records.
- Authentication is not implemented. CORS allows local Vite development origins only. Add authentication and deployment-specific CORS before exposing this API beyond a local demo.
- Verification findings are scoped to the encoded input bounds, string-region encoding, runtime priority semantics, and solver timeout. `UNKNOWN` remains inconclusive.
