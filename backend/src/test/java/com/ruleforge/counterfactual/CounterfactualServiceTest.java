package com.ruleforge.counterfactual;

import com.ruleforge.domain.*;
import com.ruleforge.dsl.ConditionParser;
import com.ruleforge.engine.EvaluationService;
import com.ruleforge.persistence.RulesetStore;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class CounterfactualServiceTest {
    @SuppressWarnings("unchecked") @Test void candidateMeetsTargetAndSearchProvesFiniteRepresentativeOptimum(){
        var rule=new RuleDefinition("DISC","Credit discount","",1,"creditScore >= 700 AND orderAmount > 5000",new RuleDefinition.Action(new BigDecimal("10"),true,null,null,List.of(),"discount"),true);
        var rs=new Ruleset("rs","Demo","","1.0.0","PUBLISHED",false,1,"UNVERIFIED",Instant.now(),Instant.now(),List.of(rule),List.of());
        RulesetStore store=new RulesetStore(null,null){@Override public Optional<Ruleset> get(String id){return Optional.of(rs);}@Override public Optional<Ruleset> getVersion(String id,String version){return Optional.of(rs);}};
        var service=new CounterfactualService(store,new EvaluationService(new ConditionParser()));var input=new BusinessInput(BusinessInput.Tier.BRONZE,new BigDecimal("4000.00"),650,25,"US_EAST",false);
        var request=new CounterfactualService.Request("1.0.0",input,new CounterfactualService.Target("discountPercentage",">=",10),null,5);
        Map<String,Object> response=service.search("rs",request);List<Map<String,Object>> explanations=(List<Map<String,Object>>)response.get("explanations");
        assertFalse(explanations.isEmpty());assertTrue((Boolean)response.get("isOptimalityProven"));
        Map<String,Object> outcome=(Map<String,Object>)explanations.getFirst().get("simulatedOutcome");assertTrue(((BigDecimal)outcome.get("discountPercentage")).compareTo(BigDecimal.TEN)>=0);
    }
}
