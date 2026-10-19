package com.ruleforge.configuration;

import com.ruleforge.dsl.ConditionParser;
import com.ruleforge.engine.EvaluationService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CoreConfiguration {
    @Bean ConditionParser conditionParser(){return new ConditionParser();}
    @Bean EvaluationService evaluationService(ConditionParser parser){return new EvaluationService(parser);}
}
