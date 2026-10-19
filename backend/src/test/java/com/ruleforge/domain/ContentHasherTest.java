package com.ruleforge.domain;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ContentHasherTest {
    @Test void contentHashIgnoresRuleOrderingAndFormattingWhitespace(){
        var a=new RuleDefinition("A","Rule A","",1,"customerTier == GOLD AND orderAmount > 50",new RuleDefinition.Action(new BigDecimal("10"),true,null,null,List.of(),null),true);
        var formatted=new RuleDefinition("A","Rule A","",1," customerTier   == GOLD AND   orderAmount > 50 ",new RuleDefinition.Action(new BigDecimal("10.0"),true,null,null,List.of(),null),true);
        var b=new RuleDefinition("B","Rule B","",2,"creditScore >= 700",new RuleDefinition.Action(null,true,null,null,List.of(),null),true);
        var hasher=new ContentHasher();assertEquals(hasher.hash(List.of(a,b)),hasher.hash(List.of(b,formatted)));
    }
}
