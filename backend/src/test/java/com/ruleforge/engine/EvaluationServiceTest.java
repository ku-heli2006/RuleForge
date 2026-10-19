package com.ruleforge.engine;

import com.ruleforge.domain.*;
import com.ruleforge.dsl.ConditionParser;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class EvaluationServiceTest {
    private final EvaluationService service=new EvaluationService(new ConditionParser());
    private RuleDefinition rule(String id,int priority,String condition,BigDecimal discount,Boolean eligible){return new RuleDefinition(id,id,"",priority,condition,new RuleDefinition.Action(discount,eligible,null,null,List.of(),id),true);}
    private BusinessInput input(){return new BusinessInput(BusinessInput.Tier.GOLD,new BigDecimal("6000.00"),720,25,"US_EAST",true);}
    @Test void lowestPriorityNumberWinsPerFieldAndDifferentFieldsCompose(){
        var rules=List.of(rule("high",1,"creditScore >= 700",new BigDecimal("15"),null),rule("low",2,"customerTier == GOLD",new BigDecimal("10"),false));
        var result=service.evaluate("rs","1.0.0",rules,input());
        assertFalse(result.eligible()); assertEquals(new BigDecimal("0"),result.discountPercentage());
        assertEquals(List.of("high","low"),result.matchedRules().stream().map(RuleDefinition::id).toList());
    }
    @Test void conflictingSamePriorityActionsAreReported(){
        var rules=List.of(new RuleDefinition("shipping","Shipping","",0,"isFirstOrder == true",new RuleDefinition.Action(null,null,true,null,List.of(),null),true),rule("a",1,"creditScore >= 700",new BigDecimal("10"),null),rule("b",1,"customerTier == GOLD",new BigDecimal("20"),null));
        assertThrows(IllegalStateException.class,()->service.evaluate("rs","1.0",rules,input()));
    }
}
