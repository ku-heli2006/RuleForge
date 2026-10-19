package com.ruleforge.configuration;

import com.ruleforge.domain.*;
import com.ruleforge.persistence.RulesetStore;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

/** Seed a synthetic local demo when the database is empty so the packaged frontend has a default ruleset. */
@Component
public class DemoDataInitializer implements ApplicationRunner {
    private final RulesetStore store;
    public DemoDataInitializer(RulesetStore store){this.store=store;}
    @Override @Transactional public void run(ApplicationArguments args){if(!store.list().isEmpty())return;
        RuleDefinition platinum=rule("RULE-101","VIP Platinum High-Value Discount",1,"customerTier == PLATINUM AND orderAmount > 5000",20,true,true,true,"Platinum Tier High-Value Reward applied.");
        RuleDefinition gold=rule("RULE-102","Gold Member Threshold Incentive",2,"customerTier == GOLD AND orderAmount > 2500",10,true,false,false,"Gold Member Standard Reward applied.");
        RuleDefinition credit=rule("RULE-103","Prime Credit Loyalty Boost",3,"creditScore >= 720 AND orderAmount > 1500",15,true,true,false,"Prime Credit Score Booster applied.");
        RuleDefinition first=rule("RULE-104","First Order Welcome Bonus",4,"isFirstOrder == true AND orderAmount >= 50",5,true,false,false,"First order welcome perk.");
        RuleDefinition risk=rule("RULE-105","Subprime Risk Restriction",5,"creditScore < 550 AND isFirstOrder == false",0,false,false,false,"Subprime restriction: promotional discount ineligible.");
        RuleDefinition young=rule("RULE-106","Underage Bronze Bonus",6,"customerAge < 18 AND orderAmount > 10000 AND customerTier == BRONZE",2,true,false,false,"Underage bonus.");
        List<RuleDefinition> v10=List.of(platinum,gold,first,rule("RULE-103-OLD","Initial Credit Discount",3,"creditScore >= 750 AND orderAmount > 3000",7,true,false,false,"Initial credit reward."));
        List<RuleDefinition> v11=List.of(platinum,gold,first,risk,rule("RULE-103-OLD","Initial Credit Discount",3,"creditScore >= 750 AND orderAmount > 3000",7,true,false,false,"Initial credit reward."));
        List<RuleDefinition> v12=List.of(platinum,gold,credit,first,risk,young);
        store.create("rs-ecommerce-discounts","E-Commerce Tiered VIP & Discount Engine","Synthetic demo ruleset for the RuleForge frontend.",v10);store.publish("rs-ecommerce-discounts");
        store.duplicate("rs-ecommerce-discounts","1.0.0");store.update("rs-ecommerce-discounts",null,null,v11);store.publish("rs-ecommerce-discounts");
        store.duplicate("rs-ecommerce-discounts","1.1.0");store.update("rs-ecommerce-discounts",null,null,v12);store.publish("rs-ecommerce-discounts");
    }
    private RuleDefinition rule(String id,String name,int priority,String condition,int discount,boolean eligible,boolean shipping,boolean processing,String message){return new RuleDefinition(id,name,"Synthetic demo rule",priority,condition,new RuleDefinition.Action(BigDecimal.valueOf(discount),eligible,shipping,processing,List.of(),message),true);}
}
