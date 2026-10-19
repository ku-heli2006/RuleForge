# Verification semantics

`Z3Verifier` translates `Condition` nodes produced by the runtime parser, not a second expression grammar. It checks pairwise overlap, incompatible same-priority assignments, reachability, and field-aware shadowing. Lower numeric priority wins at runtime; a higher-priority override is not itself an unresolved conflict. Tags combine, so a rule that contributes a tag can still affect the result even when its scalar assignments lose.

The encoded domain is: tier in BRONZE/SILVER/GOLD/PLATINUM; amount cents in `[0, 100000000]`; credit score in `[300,850]`; age in `[0,120]`; boolean first-order; and region as an integer code for each distinct region literal in the ruleset. Other region values are represented by an unconstrained code. The model has no age-dependent purchase cap or external business axioms. Consequently, findings are only proofs about this model.

Each check has a timeout (default 3000 ms, clamped to 10000 ms). Z3 `SAT` returns a witness, `UNSAT` is scoped to the constraints listed above, and `UNKNOWN` is reported as inconclusive. Solver contexts are created per query and closed. Overlap findings do not imply action conflicts. Equal-priority incompatible scalar assignments are conflicts; distinct priorities are resolved by runtime ordering.

Shadowing means a rule cannot contribute any assigned scalar output or tag under the runtime priority policy. It is evaluated by checking the rule condition while excluding higher-priority rules that assign the same field. This implementation has no relational constraints beyond the explicit field ranges.
