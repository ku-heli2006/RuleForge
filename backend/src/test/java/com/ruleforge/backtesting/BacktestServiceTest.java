package com.ruleforge.backtesting;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ruleforge.domain.*;
import com.ruleforge.engine.EvaluationService;
import com.ruleforge.dsl.ConditionParser;
import com.ruleforge.persistence.RulesetStore;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class BacktestServiceTest {
    @Test void deterministicDatasetComparedToSameVersionHasNoChanges(){
        var rule=new RuleDefinition("FIRST","First order discount","",1,"isFirstOrder == true AND orderAmount >= 50",new RuleDefinition.Action(new BigDecimal("5"),true,false,null,List.of(),"welcome"),true);
        var version=new Ruleset("rs","Demo","","1.0.0","PUBLISHED",false,1,"UNVERIFIED",Instant.now(),Instant.now(),List.of(rule),List.of());
        RulesetStore store=new RulesetStore(null,null){@Override public Optional<Ruleset> getVersion(String id,String versionId){return Optional.of(version);}};
        JdbcTemplate jdbc=new JdbcTemplate(){@Override public int update(String sql,Object... args){return 1;}};
        var service=new BacktestService(store,new EvaluationService(new ConditionParser()),jdbc,new ObjectMapper().findAndRegisterModules());
        Map<String,Object> result=service.run(new BacktestService.Request("rs","1.0.0","1.0.0","ds-q3-prod-historical",null));
        assertEquals("COMPLETED",result.get("status"));assertEquals(0,result.get("changedDecisions"));assertEquals(500,result.get("unchangedDecisions"));assertEquals(BigDecimal.ZERO,result.get("estimatedFinancialImpact"));
    }
}
