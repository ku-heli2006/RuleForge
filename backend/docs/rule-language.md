# Rule language

The first parser slice accepts condition expressions over `customerTier`, `orderAmount`, `creditScore`, `customerAge`, `region`, and `isFirstOrder`. Comparisons support `==`, `!=`, `>`, `<`, `>=`, and `<=`; parentheses, `AND`, and `OR` are supported. `AND` binds more tightly than `OR`.

Example: `customerTier == PLATINUM AND (orderAmount > 5000 OR creditScore >= 720)`.

Tier literals are `BRONZE`, `SILVER`, `GOLD`, and `PLATINUM`; booleans are `true` and `false`. Region values may be quoted strings. Numeric literals are bounded by the corresponding input field range. `customerTier`, `region`, and `isFirstOrder` support only equality and inequality.
