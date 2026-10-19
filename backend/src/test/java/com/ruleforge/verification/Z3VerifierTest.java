package com.ruleforge.verification;

import com.ruleforge.domain.RuleDefinition;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class Z3VerifierTest {
    private final Z3Verifier verifier=new Z3Verifier();
    private RuleDefinition rule(String id,int priority,String condition,int discount){return new RuleDefinition(id,id,"",priority,condition,new RuleDefinition.Action(BigDecimal.valueOf(discount),true,null,null,List.of(),null),true);}
    @Test void producesWitnessForOverlapAndUnreachableForContradiction(){
        var a=rule("a",1,"customerTier == GOLD AND orderAmount > 100",10);
        var b=rule("b",2,"creditScore >= 700 AND orderAmount > 200",15);
        var c=rule("c",3,"creditScore < 300",5);
        var response=verifier.verify("rs","1.0.0",List.of(a,b,c),3000);
        assertTrue(response.findings().stream().anyMatch(f->f.type().equals("OVERLAP")&&f.solverResult().equals("SAT")&&f.witnessInput()!=null));
        assertTrue(response.findings().stream().anyMatch(f->f.type().equals("UNREACHABLE")&&f.ruleIds().equals(List.of("c"))&&f.solverResult().equals("UNSAT")));
    }
    @Test void higherPriorityOverridePreventsLowerSamePriorityConflictFinding(){
        var high=rule("high",0,"customerTier == GOLD",20);
        var a=rule("a",1,"customerTier == GOLD AND creditScore >= 700",10);
        var b=rule("b",1,"customerTier == GOLD AND orderAmount > 100",15);
        var response=verifier.verify("rs","1.0.0",List.of(high,a,b),3000,java.util.Set.of("CONFLICT"));
        assertTrue(response.findings().stream().noneMatch(f->f.type().equals("CONFLICT")));
    }
}
