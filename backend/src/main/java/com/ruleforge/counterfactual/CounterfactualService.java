package com.ruleforge.counterfactual;

import com.ruleforge.domain.*;
import com.ruleforge.dsl.*;
import com.ruleforge.engine.EvaluationService;
import com.ruleforge.persistence.RulesetStore;
import org.springframework.stereotype.Service;
import java.math.*;
import java.time.Instant;
import java.util.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Exact search over equivalence representatives induced by rule thresholds. */
@Service
public class CounterfactualService {
    private static final long MAX_CANDIDATES=300_000;
    private final RulesetStore store;private final EvaluationService evaluator;private final ConditionParser parser=new ConditionParser();
    public CounterfactualService(RulesetStore store,EvaluationService evaluator){this.store=store;this.evaluator=evaluator;}
    public Map<String,Object> search(String id,Request req){
        if(req.originalInput()==null||req.targetOutcome()==null||req.targetOutcome().targetValue()==null)throw new IllegalArgumentException("originalInput and targetOutcome are required.");
        if(!Set.of("discountPercentage","eligible","freeShipping").contains(req.targetOutcome().field()))throw new IllegalArgumentException("Unsupported target field: "+req.targetOutcome().field());
        if(!Set.of("==",">",">=","<","<=").contains(req.targetOutcome().operator()))throw new IllegalArgumentException("Unsupported target operator: "+req.targetOutcome().operator());
        if(req.targetOutcome().field().equals("discountPercentage")&&!(req.targetOutcome().targetValue() instanceof Number))throw new IllegalArgumentException("discountPercentage target must be numeric.");
        if(!req.targetOutcome().field().equals("discountPercentage")&&!(req.targetOutcome().targetValue() instanceof Boolean))throw new IllegalArgumentException("Boolean target fields require a true/false target.");
        if(!req.targetOutcome().field().equals("discountPercentage")&&!req.targetOutcome().operator().equals("=="))throw new IllegalArgumentException("Boolean target fields support only ==.");
        if(req.maxSearchCost()!=null&&req.maxSearchCost()<0)throw new IllegalArgumentException("maxSearchCost must be nonnegative.");
        if(req.maxSolutions()!=null&&(req.maxSolutions()<1||req.maxSolutions()>20))throw new IllegalArgumentException("maxSolutions must be between 1 and 20.");
        Ruleset latest=store.get(id).orElseThrow(()->new NoSuchElementException("Ruleset not found: "+id));String version=req.version()==null?latest.version():req.version();Ruleset rs=store.getVersion(id,version).orElseThrow(()->new NoSuchElementException("Ruleset version not found: "+version));
        long started=System.nanoTime(),deadline=started+10_000_000_000L;var original=evaluator.evaluate(id,version,rs.rules(),req.originalInput());List<List<Object>> values=domains(req.originalInput(),rs.rules());long combinations=1;for(var d:values)combinations=combinations>MAX_CANDIDATES/d.size()?MAX_CANDIDATES+1:combinations*d.size();
        List<Candidate> matches=new ArrayList<>();double best=Double.POSITIVE_INFINITY;long evaluated=0;boolean completed=true;
        outer: for(Object tier:values.get(0))for(Object amount:values.get(1))for(Object score:values.get(2))for(Object age:values.get(3))for(Object region:values.get(4))for(Object first:values.get(5)){
            if(evaluated++>=MAX_CANDIDATES||System.nanoTime()>=deadline){completed=false;break outer;}
            BusinessInput candidate=new BusinessInput((BusinessInput.Tier)tier,(BigDecimal)amount,(Integer)score,(Integer)age,(String)region,(Boolean)first);
            EvaluationService.Result result;try{result=evaluator.evaluate(id,version,rs.rules(),candidate);}catch(IllegalStateException e){continue;}
            if(!target(result,req.targetOutcome()))continue;double cost=cost(req.originalInput(),candidate);if(req.maxSearchCost()!=null&&cost>req.maxSearchCost())continue;
            if(cost+1e-10<best){best=cost;matches.clear();}if(Math.abs(cost-best)<1e-10&&matches.size()<Math.max(1,Math.min(req.maxSolutions()==null?5:req.maxSolutions(),20)))matches.add(new Candidate(candidate,result,cost));
        }
        boolean complete=completed&&combinations<=MAX_CANDIDATES;List<Map<String,Object>> explanations=new ArrayList<>();for(int i=0;i<matches.size();i++)explanations.add(explanation(i+1,req.originalInput(),matches.get(i),complete));
        Map<String,Object> out=new LinkedHashMap<>();out.put("rulesetId",id);out.put("version",version);out.put("originalInput",req.originalInput());out.put("originalOutcome",outcome(original));out.put("targetOutcome",req.targetOutcome());out.put("explanations",explanations);out.put("isOptimalityProven",complete&&!matches.isEmpty());out.put("searchStatus",complete?(matches.isEmpty()?"INFEASIBLE":"SUCCESS_OPTIMAL"):(matches.isEmpty()?"LIMIT_EXCEEDED":"SUCCESS_HEURISTIC"));out.put("searchDurationMs",(System.nanoTime()-started)/1_000_000.0);out.put("solver","Bounded exact threshold search");out.put("generatedAt",Instant.now());return out;
    }
    private List<List<Object>> domains(BusinessInput in,List<RuleDefinition> rules){
        TreeSet<BigDecimal> amounts=new TreeSet<>();amounts.add(BigDecimal.ZERO);amounts.add(new BigDecimal("1000000.00"));addAround(amounts,in.orderAmount(),new BigDecimal("0.01"),new BigDecimal("0.00"),new BigDecimal("1000000.00"));
        TreeSet<Integer> scores=new TreeSet<>(List.of(300,850));scores.add(in.creditScore());TreeSet<Integer> ages=new TreeSet<>(List.of(0,120));ages.add(in.customerAge());
        Set<String> regions=new TreeSet<>(List.of(in.region(),"OTHER"));for(var r:rules)collect(rulesCondition(r.condition()),amounts,scores,ages,regions);
        List<Object> tierValues=new ArrayList<>();Collections.addAll(tierValues,BusinessInput.Tier.values());List<List<Object>> result=new ArrayList<>();result.add(tierValues);result.add(new ArrayList<>(amounts));result.add(new ArrayList<>(scores));result.add(new ArrayList<>(ages));result.add(new ArrayList<>(regions));result.add(new ArrayList<>(List.of(false,true)));return result;
    }
    private Condition rulesCondition(String s){return parser.parse(s);}
    private void collect(Condition c,Set<BigDecimal> amounts,Set<Integer> scores,Set<Integer> ages,Set<String> regions){if(c instanceof Condition.Compare x){try{switch(x.field()){case "orderAmount"->addAround(amounts,new BigDecimal(x.literal()),new BigDecimal("0.01"),BigDecimal.ZERO,new BigDecimal("1000000.00"));case "creditScore"->addAround(scores,Integer.parseInt(x.literal()),1,300,850);case "customerAge"->addAround(ages,Integer.parseInt(x.literal()),1,0,120);case "region"->regions.add(strip(x.literal()));default->{}}}catch(Exception ignored){}}else if(c instanceof Condition.Junction j){collect(j.left(),amounts,scores,ages,regions);collect(j.right(),amounts,scores,ages,regions);}else if(c instanceof Condition.Negation n)collect(n.value(),amounts,scores,ages,regions);}
    private void addAround(Set<BigDecimal> s,BigDecimal x,BigDecimal step,BigDecimal min,BigDecimal max){for(BigDecimal y:List.of(x.subtract(step),x,x.add(step)))if(y.compareTo(min)>=0&&y.compareTo(max)<=0)s.add(y.setScale(2,RoundingMode.HALF_UP));}
    private void addAround(Set<Integer> s,int x,int step,int min,int max){for(int y:new int[]{x-step,x,x+step})if(y>=min&&y<=max)s.add(y);}
    private boolean target(EvaluationService.Result r,Target t){Object actual=switch(t.field()){case "discountPercentage"->r.discountPercentage();case "eligible"->r.eligible();case "freeShipping"->r.appliedActions().getOrDefault("freeShipping",false);default->throw new IllegalArgumentException("Unsupported target field: "+t.field());};int cmp;if(actual instanceof BigDecimal n)cmp=n.compareTo(new BigDecimal(t.targetValue().toString()));else cmp=Boolean.compare((Boolean)actual,Boolean.parseBoolean(t.targetValue().toString()));return switch(t.operator()){case "=="->cmp==0;case ">"->cmp>0;case ">="->cmp>=0;case "<"->cmp<0;case "<="->cmp<=0;default->false;};}
    private double cost(BusinessInput a,BusinessInput b){return Math.abs(a.customerTier().ordinal()-b.customerTier().ordinal())/3.0+Math.abs(a.orderAmount().subtract(b.orderAmount()).doubleValue())/1_000_000.0+Math.abs(a.creditScore()-b.creditScore())/550.0+Math.abs(a.customerAge()-b.customerAge())/120.0+(a.region().equals(b.region())?0:0.5)+(a.isFirstOrder()==b.isFirstOrder()?0:0.5);}
    private Map<String,Object> outcome(EvaluationService.Result r){return Map.of("eligible",r.eligible(),"discountPercentage",r.discountPercentage(),"freeShipping",r.appliedActions().getOrDefault("freeShipping",false));}
    private Map<String,Object> explanation(int rank,BusinessInput original,Candidate candidate,boolean complete){List<Map<String,Object>> changes=new ArrayList<>();addChange(changes,"customerTier","Customer Tier",original.customerTier().name(),candidate.input.customerTier().name(),Math.abs(original.customerTier().ordinal()-candidate.input.customerTier().ordinal())/3.0);addChange(changes,"orderAmount","Order Amount",original.orderAmount(),candidate.input.orderAmount(),Math.abs(original.orderAmount().subtract(candidate.input.orderAmount()).doubleValue())/1_000_000.0);addChange(changes,"creditScore","Credit Score",original.creditScore(),candidate.input.creditScore(),Math.abs(original.creditScore()-candidate.input.creditScore())/550.0);addChange(changes,"customerAge","Customer Age",original.customerAge(),candidate.input.customerAge(),Math.abs(original.customerAge()-candidate.input.customerAge())/120.0);addChange(changes,"region","Region",original.region(),candidate.input.region(),original.region().equals(candidate.input.region())?0:0.5);addChange(changes,"isFirstOrder","First Order",original.isFirstOrder(),candidate.input.isFirstOrder(),original.isFirstOrder()==candidate.input.isFirstOrder()?0:0.5);
        Map<String,Object> result=new LinkedHashMap<>();result.put("id","CF-"+rank);result.put("rank",rank);result.put("changedFields",changes);result.put("totalCost",candidate.cost);result.put("simulatedInput",candidate.input);result.put("simulatedOutcome",outcome(candidate.result));result.put("responsibleRuleIds",candidate.result.matchedRules().stream().map(RuleDefinition::id).toList());result.put("explanation",changes.isEmpty()?"The original input already satisfies the requested outcome.":"This minimum-cost change satisfies the requested outcome under the current ruleset.");result.put("isProvenOptimal",complete);result.put("searchStatus",complete?"SUCCESS_OPTIMAL":"SUCCESS_HEURISTIC");result.put("solverLimitations",complete?"Exact over all rule-threshold equivalence representatives in the bounded input domain.":"Candidate search stopped at the configured 300000 evaluation limit; optimality is not established.");return result;}
    private void addChange(List<Map<String,Object>> list,String field,String label,Object a,Object b,double cost){if(!Objects.equals(a,b))list.add(Map.of("field",field,"fieldLabel",label,"originalValue",a,"proposedValue",b,"deltaDescription",String.valueOf(b),"cost",cost));}
    private String strip(String s){return s.length()>1&&(s.startsWith("'")||s.startsWith("\""))?s.substring(1,s.length()-1):s;}
    private record Candidate(BusinessInput input,EvaluationService.Result result,double cost){}
    public record Target(String field,String operator,Object targetValue){}
    public record Request(@Size(max=64) String version,@NotNull @Valid BusinessInput originalInput,@NotNull @Valid Target targetOutcome,Double maxSearchCost,Integer maxSolutions){}
}
