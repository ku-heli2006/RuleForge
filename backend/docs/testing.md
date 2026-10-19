# Testing

Run `mvn test` with JDK 21 or newer. Unit tests cover parser precedence, type/range rejection, deterministic priority handling, equal-priority conflicts, stable hashes across ordering/formatting, Z3 overlap witnesses and unreachable boundaries, and counterfactual target satisfaction.

Not yet covered: Postgres migration and transaction integration tests, API-level MockMvc tests, exhaustive brute-force comparisons against Z3, reliable timeout/UNKNOWN injection, backtest CSV integration checks, concurrency tests against a live database, and reproducible JMH benchmarks. These are known coverage gaps.
