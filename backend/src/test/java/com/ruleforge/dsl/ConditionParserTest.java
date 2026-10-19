package com.ruleforge.dsl;

import com.ruleforge.domain.BusinessInput;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

class ConditionParserTest {
    private final ConditionParser parser = new ConditionParser();
    private final BusinessInput sample = new BusinessInput(BusinessInput.Tier.GOLD,new BigDecimal("6000.00"),720,25,"US_EAST",true);
    @Test void comparisonsAndBooleanPrecedenceAreEvaluated(){
        assertTrue(parser.parse("customerTier == GOLD AND orderAmount > 5000 OR creditScore < 300").test(sample));
        assertFalse(parser.parse("customerTier == GOLD AND (orderAmount < 5000 OR creditScore < 300)").test(sample));
        assertTrue(parser.parse("isFirstOrder == true AND region == 'US_EAST'").test(sample));
    }
    @Test void rejectsUnknownFieldsAndInvalidTypes(){
        assertThrows(IllegalArgumentException.class,()->parser.parse("customerLevel == GOLD"));
        assertThrows(IllegalArgumentException.class,()->parser.parse("customerTier > GOLD"));
        assertThrows(IllegalArgumentException.class,()->parser.parse("creditScore == 999"));
    }
}
