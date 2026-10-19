package com.ruleforge.dsl;

import com.ruleforge.domain.BusinessInput;
import java.math.BigDecimal;
import java.util.Locale;

public sealed interface Condition permits Condition.Compare, Condition.Junction, Condition.Negation {
    boolean test(BusinessInput input);
    record Junction(boolean and, Condition left, Condition right) implements Condition {
        public boolean test(BusinessInput i) { return and ? left.test(i) && right.test(i) : left.test(i) || right.test(i); }
    }
    record Negation(Condition value) implements Condition { public boolean test(BusinessInput i) { return !value.test(i); } }
    record Compare(String field, String operator, String literal) implements Condition {
        public boolean test(BusinessInput i) {
            Object actual = switch (field) {
                case "customerTier" -> i.customerTier(); case "orderAmount" -> i.orderAmount();
                case "creditScore" -> i.creditScore(); case "customerAge" -> i.customerAge();
                case "region" -> i.region(); case "isFirstOrder" -> i.isFirstOrder();
                default -> throw new IllegalArgumentException("Unknown field: " + field);
            };
            int cmp;
            if (actual instanceof BigDecimal n) cmp = n.compareTo(new BigDecimal(literal));
            else if (actual instanceof Number n) cmp = Integer.compare(n.intValue(), Integer.parseInt(literal));
            else if (actual instanceof Boolean b) cmp = Boolean.compare(b, Boolean.parseBoolean(literal));
            else if (field.equals("customerTier")) cmp = Integer.compare(BusinessInput.Tier.valueOf(literal.toUpperCase(Locale.ROOT)).ordinal(), ((BusinessInput.Tier)actual).ordinal());
            else cmp = actual.toString().compareTo(stripQuotes(literal));
            return switch(operator) { case "==" -> cmp==0; case "!=" -> cmp!=0; case ">" -> cmp>0; case "<" -> cmp<0; case ">=" -> cmp>=0; case "<=" -> cmp<=0; default -> throw new IllegalArgumentException("Unsupported operator: " + operator); };
        }
        private static String stripQuotes(String s) { return s.length() >= 2 && (s.startsWith("'") || s.startsWith("\"")) ? s.substring(1,s.length()-1) : s; }
    }
}
