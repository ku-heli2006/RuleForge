# Counterfactual algorithm

The target is a typed comparison over `discountPercentage`, `eligible`, or `freeShipping`. The service evaluates the original input, then derives candidate representatives from every numeric condition boundary and its adjacent discrete values, all tiers, both boolean values, literal regions, and an `OTHER` region representative. Amounts are represented to cents, scores and ages to integers. Within the modeled DSL, predicates cannot change between adjacent representatives.

The search enumerates their Cartesian product up to 300,000 candidates and reuses the normal evaluator. Costs are the sum of normalized changes: tier ordinal distance / 3; order amount distance / 1,000,000; credit score distance / 550; age distance / 120; region change = 0.5; first-order change = 0.5. A caller may set `maxSearchCost` and `maxSolutions` (1 to 20).

If the full representative space is searched, returned minimum-cost ties are marked `SUCCESS_OPTIMAL`. If the cap is reached, candidates are `SUCCESS_HEURISTIC` and `isProvenOptimal` is false. An exhausted search with no solution returns no explanations and top-level `searchStatus: INFEASIBLE`. This is finite-domain exhaustive search, not an Optimize proof over a continuous or unbounded domain.
