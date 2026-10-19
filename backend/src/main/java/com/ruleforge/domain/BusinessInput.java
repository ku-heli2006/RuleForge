package com.ruleforge.domain;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record BusinessInput(
        @NotNull Tier customerTier,
        @NotNull @DecimalMin("0.00") @DecimalMax("1000000.00") @Digits(integer = 7, fraction = 2) BigDecimal orderAmount,
        @Min(300) @Max(850) int creditScore,
        @Min(0) @Max(120) int customerAge,
        @NotBlank @Size(max = 40) @Pattern(regexp = "[A-Za-z0-9_-]+") String region,
        boolean isFirstOrder) {
    public enum Tier { BRONZE, SILVER, GOLD, PLATINUM }
}
