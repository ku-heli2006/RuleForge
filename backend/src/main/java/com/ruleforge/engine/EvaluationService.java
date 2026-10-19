package com.ruleforge.engine;

import com.ruleforge.domain.*;
import com.ruleforge.dsl.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class EvaluationService {
    private final ConditionParser parser;
    private final Map<CacheKey,List<CompiledRule>> compiledRules=new ConcurrentHashMap<>();
    public EvaluationService(ConditionParser parser){this.parser=parser;}
    public Result evaluate(String rulesetId, String version, List<RuleDefinition> rules, BusinessInput input) {
        long start=System.nanoTime();
        List<RuleDefinition> matched=new ArrayList<>(), unmatched=new ArrayList<>();
        CacheKey key=new CacheKey(rulesetId,version,List.copyOf(rules));
        if(compiledRules.size()>256)compiledRules.clear();
        for (var compiled:compiledRules.computeIfAbsent(key,k->rules.stream().map(r->new CompiledRule(r,parser.parse(r.condition()))).toList())) if(compiled.rule().enabled()) { if(compiled.condition().test(input)) matched.add(compiled.rule()); else unmatched.add(compiled.rule()); }
        Comparator<RuleDefinition> order=Comparator.comparingInt(RuleDefinition::priority).thenComparing(RuleDefinition::id);
        matched.sort(order);
        Set<String> appliedIds=new LinkedHashSet<>();
        BigDecimal discount=choose(matched, r->r.action().discountPercentage(), BigDecimal.ZERO, "discountPercentage",appliedIds);
        Boolean eligible=choose(matched, r->r.action().eligible(), Boolean.TRUE, "eligible",appliedIds);
        Boolean freeShipping=choose(matched, r->r.action().freeShipping(), Boolean.FALSE, "freeShipping",appliedIds);
        Boolean priorityProcessing=choose(matched, r->r.action().priorityProcessing(), Boolean.FALSE, "priorityProcessing",appliedIds);
        if(!eligible) discount=BigDecimal.ZERO;
        List<String> reasons=matched.stream().map(r->r.action().message()==null||r.action().message().isBlank()?r.name()+" matched.":r.action().message()).toList();
        matched.stream().filter(r->r.action().message()!=null&&!r.action().message().isBlank()).forEach(r->appliedIds.add(r.id()));
        Set<String> tags=new TreeSet<>();matched.forEach(r->{if(!r.action().customTags().isEmpty()){tags.addAll(r.action().customTags());appliedIds.add(r.id());}});
        var traces=new ArrayList<Map<String,Object>>();
        for(var r:rules) if(r.enabled()) { boolean hit=matched.contains(r);var trace=new LinkedHashMap<String,Object>();trace.put("ruleId",r.id());trace.put("ruleName",r.name());trace.put("priority",r.priority());trace.put("conditionEvaluated",hit);trace.put("conditionExpression",r.condition());trace.put("reason",!hit?"Condition did not match.":appliedIds.contains(r.id())?"Matched and contributed to the decision.":"Matched, but its assigned outputs were suppressed by higher-priority rules.");if(hit&&appliedIds.contains(r.id()))trace.put("actionApplied",r.action());traces.add(trace); }
        List<String> suppressed=matched.stream().map(RuleDefinition::id).filter(id->!appliedIds.contains(id)).toList();
        var actions=new LinkedHashMap<String,Object>(); actions.put("eligible",eligible); actions.put("discountPercentage",discount); actions.put("freeShipping",freeShipping); actions.put("priorityProcessing",priorityProcessing);actions.put("customTags",List.copyOf(tags));actions.put("message",String.join(" ",reasons));
        List<Map<String,Object>> unmatchedDetails=unmatched.stream().map(r->Map.<String,Object>of("rule",r,"failedPredicate","Condition did not match: "+r.condition())).toList();
        return new Result(rulesetId,version,eligible,discount,actions,matched,unmatchedDetails,matched.stream().map(RuleDefinition::id).filter(appliedIds::contains).toList(),suppressed,traces,reasons.isEmpty()?List.of("No promotional discount rules matched. Default pricing applied."):reasons,(System.nanoTime()-start)/1_000_000.0,Instant.now());
    }
    private <T> T choose(List<RuleDefinition> rules, java.util.function.Function<RuleDefinition,T> getter, T fallback, String field,Set<String> appliedIds) {
        for(var r:rules) { T v=getter.apply(r); if(v==null) continue; int p=r.priority();
            for(var other:rules) { if(other.priority()!=p) continue; T ov=getter.apply(other); if(ov!=null&&!Objects.equals(v,ov)) throw new IllegalStateException("Conflicting same-priority actions for "+field+" in rules "+r.id()+" and "+other.id()); }
            appliedIds.add(r.id());return v;
        } return fallback;
    }
    private record CompiledRule(RuleDefinition rule,Condition condition){}
    private record CacheKey(String rulesetId,String version,List<RuleDefinition> rules){}
    public record Result(String rulesetId,String rulesetVersion,boolean eligible,BigDecimal discountPercentage,
                         Map<String,Object> appliedActions,List<RuleDefinition> matchedRules,List<Map<String,Object>> unmatchedRules,List<String> appliedRuleIds,List<String> suppressedRules,
                         List<Map<String,Object>> trace,List<String> reasons,double evaluationDurationMs,Instant evaluatedAt) { }
}
