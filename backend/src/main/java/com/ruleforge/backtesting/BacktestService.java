package com.ruleforge.backtesting;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ruleforge.domain.*;
import com.ruleforge.engine.EvaluationService;
import com.ruleforge.persistence.RulesetStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Service
public class BacktestService {
    private static final String DATASET="ds-q3-prod-historical";
    private final RulesetStore store;private final EvaluationService evaluator;private final JdbcTemplate jdbc;private final ObjectMapper json;
    public BacktestService(RulesetStore store,EvaluationService evaluator,JdbcTemplate jdbc,ObjectMapper json){this.store=store;this.evaluator=evaluator;this.jdbc=jdbc;this.json=json;}
    @Transactional public Map<String,Object> run(Request req){
        if(!DATASET.equals(req.datasetId()))throw new IllegalArgumentException("Unknown dataset. Available synthetic dataset: "+DATASET);
        String base=normalize(req.baselineVersion()),candidate=normalize(req.candidateVersion());
        Ruleset b=store.getVersion(req.rulesetId(),base).orElseThrow(()->new NoSuchElementException("Baseline version not found: "+base));
        Ruleset c=store.getVersion(req.rulesetId(),candidate).orElseThrow(()->new NoSuchElementException("Candidate version not found: "+candidate));
        Instant start=Instant.now();List<BusinessInput> data=syntheticData();var changed=new ArrayList<Map<String,Object>>();String datasetHash=datasetHash(data),baselineHash=new ContentHasher().hash(b.rules()),candidateHash=new ContentHasher().hash(c.rules());
        Map<String,Segment> tiers=new TreeMap<>(),regions=new TreeMap<>();Map<String,Integer> bdist=distribution(),cdist=distribution();BigDecimal financial=BigDecimal.ZERO;int changedCount=0;
        var filters=req.segmentFilters()==null?Map.<String,String>of():req.segmentFilters();
        int ix=0;for(int from=0;from<data.size();from+=100)for(int row=from;row<Math.min(data.size(),from+100);row++){BusinessInput input=data.get(row);if(filters.containsKey("region")&&!filters.get("region").equals(input.region()))continue;if(filters.containsKey("customerTier")&&!filters.get("customerTier").equals(input.customerTier().name()))continue;
            var bo=evaluator.evaluate(req.rulesetId(),base,b.rules(),input);var co=evaluator.evaluate(req.rulesetId(),candidate,c.rules(),input);addDistribution(bdist,bo.eligible(),bo.discountPercentage());addDistribution(cdist,co.eligible(),co.discountPercentage());
            BigDecimal delta=input.orderAmount().multiply(co.discountPercentage().subtract(bo.discountPercentage())).divide(BigDecimal.valueOf(100),2,RoundingMode.HALF_UP);
            boolean decisionChanged=!sameDecision(bo,co);Segment ts=tiers.computeIfAbsent(input.customerTier().name(),k->new Segment());Segment rs=regions.computeIfAbsent(input.region(),k->new Segment());ts.add(bo.discountPercentage(),co.discountPercentage(),decisionChanged,delta);rs.add(bo.discountPercentage(),co.discountPercentage(),decisionChanged,delta);
            if(decisionChanged){
                changedCount++;financial=financial.add(delta);
                if(changed.size()<500){
                    Map<String,Object> record=new LinkedHashMap<>();record.put("recordId","SYN-"+String.format(Locale.ROOT,"%05d",ix));record.put("customerTier",input.customerTier().name());record.put("orderAmount",input.orderAmount());record.put("creditScore",input.creditScore());record.put("region",input.region());
                    record.put("baselineOutcome",Map.of("eligible",bo.eligible(),"discountPercentage",bo.discountPercentage()));record.put("candidateOutcome",Map.of("eligible",co.eligible(),"discountPercentage",co.discountPercentage()));record.put("netDiscountDifference",co.discountPercentage().subtract(bo.discountPercentage()));record.put("dollarImpact",delta);record.put("deltaReason","Deterministic replay outcome changed.");record.put("triggeringRules",Map.of("baselineRuleIds",bo.matchedRules().stream().map(RuleDefinition::id).toList(),"candidateRuleIds",co.matchedRules().stream().map(RuleDefinition::id).toList()));changed.add(record);
                }
            }
            ix++;
        }
        int total=ix;Map<String,Object> job=new LinkedHashMap<>();String id="bt-"+UUID.randomUUID().toString().substring(0,12);
        job.put("id",id);job.put("rulesetId",req.rulesetId());job.put("baselineVersion",base);job.put("candidateVersion",candidate);job.put("datasetId",DATASET);job.put("datasetName","RuleForge Synthetic Demo Dataset (500 generated records)");job.put("status","COMPLETED");job.put("recordsProcessed",total);job.put("totalRecords",total);job.put("changedDecisions",changedCount);job.put("unchangedDecisions",total-changedCount);job.put("percentageChanged",total==0?0:changedCount*100.0/total);job.put("estimatedFinancialImpact",financial);job.put("outcomeDistributions",Map.of("baseline",bdist,"candidate",cdist));job.put("tierBreakdown",tiers.entrySet().stream().map(e->e.getValue().asMap(e.getKey())).toList());job.put("regionBreakdown",regions.entrySet().stream().map(e->e.getValue().asRegion(e.getKey())).toList());job.put("changedRecords",changed);job.put("warnings",List.of("Dataset is synthetic; estimated discount cost is not profit."));job.put("createdAt",start);job.put("completedAt",Instant.now());
        try{String config=json.writeValueAsString(Map.of("segmentFilters",filters,"batchSize",100,"financialRounding","HALF_UP","datasetKind","synthetic"));jdbc.update("INSERT INTO backtest_jobs(id,ruleset_id,baseline_version,candidate_version,baseline_hash,candidate_hash,dataset_id,dataset_hash,processing_config,status,summary,created_at,completed_at) VALUES(?,?,?,?,?,?,?,?,?::jsonb,'COMPLETED',?::jsonb,?,?)",id,req.rulesetId(),base,candidate,baselineHash,candidateHash,DATASET,datasetHash,config,json.writeValueAsString(job),Timestamp.from(start),Timestamp.from(Instant.now()));}catch(Exception e){throw new IllegalStateException("Backtest result could not be stored",e);}return job;
    }
    public Map<String,Object> get(String id){try{String raw=jdbc.queryForObject("SELECT summary::text FROM backtest_jobs WHERE id=?",String.class,id);return json.readValue(raw,new TypeReference<Map<String,Object>>(){});}catch(org.springframework.dao.EmptyResultDataAccessException e){throw new NoSuchElementException("Backtest not found: "+id);}catch(Exception e){throw new IllegalStateException("Backtest result could not be read",e);}}
    public String csv(String id){Map<String,Object> job=get(id);if(!"COMPLETED".equals(job.get("status")))throw new IllegalStateException("Backtest is not complete.");StringBuilder out=new StringBuilder("recordId,customerTier,orderAmount,creditScore,region,baselineEligible,baselineDiscount,candidateEligible,candidateDiscount,netDiscountDifference,dollarImpact,deltaReason,baselineRuleIds,candidateRuleIds\r\n");Object rows=job.get("changedRecords");if(rows instanceof List<?> list)for(Object x:list){Map<?,?> r=(Map<?,?>)x;Map<?,?> bo=(Map<?,?>)r.get("baselineOutcome"),co=(Map<?,?>)r.get("candidateOutcome"),tr=(Map<?,?>)r.get("triggeringRules");List<?> br=(List<?>)tr.get("baselineRuleIds"),cr=(List<?>)tr.get("candidateRuleIds");List<Object> cols=List.of(r.get("recordId"),r.get("customerTier"),r.get("orderAmount"),r.get("creditScore"),r.get("region"),bo.get("eligible"),bo.get("discountPercentage"),co.get("eligible"),co.get("discountPercentage"),r.get("netDiscountDifference"),r.get("dollarImpact"),safeText(r.get("deltaReason")),safeText(String.join("|",br.stream().map(Object::toString).toList())),safeText(String.join("|",cr.stream().map(Object::toString).toList())));out.append(String.join(",",cols.stream().map(this::quote).toList())).append("\r\n");}return out.toString();}
    private String safeText(Object value){String s=String.valueOf(value);return s.matches("^[=+@-].*")?"'"+s:s;}
    private String quote(Object v){String s=String.valueOf(v);return "\""+s.replace("\"","\"\"")+"\"";}
    private String normalize(String s){return s!=null&&s.startsWith("v")?s.substring(1):s;}
    private String datasetHash(List<BusinessInput> data){try{return HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(json.writeValueAsBytes(data)));}catch(Exception e){throw new IllegalStateException("Synthetic dataset hash could not be calculated",e);}}
    private boolean sameDecision(EvaluationService.Result a,EvaluationService.Result b){for(String field:List.of("eligible","discountPercentage","freeShipping","priorityProcessing","customTags"))if(!Objects.equals(a.appliedActions().get(field),b.appliedActions().get(field)))return false;return true;}
    private Map<String,Integer> distribution(){var x=new LinkedHashMap<String,Integer>();for(String k:List.of("zeroDiscount","tier5to10","tier10to20","tier20Plus","ineligible"))x.put(k,0);return x;}
    private void addDistribution(Map<String,Integer> d,boolean eligible,BigDecimal discount){String k=!eligible?"ineligible":discount.signum()==0?"zeroDiscount":discount.compareTo(BigDecimal.TEN)<0?"tier5to10":discount.compareTo(BigDecimal.valueOf(20))<0?"tier10to20":"tier20Plus";d.compute(k,(key,v)->v+1);}
    private List<BusinessInput> syntheticData(){Random random=new Random(420);List<BusinessInput> rows=new ArrayList<>();var tiers=BusinessInput.Tier.values();var regions=List.of("US_EAST","US_WEST","EU_WEST","APAC");for(int i=0;i<500;i++)rows.add(new BusinessInput(tiers[random.nextInt(tiers.length)],BigDecimal.valueOf(500+random.nextInt(5_000_000),2),300+random.nextInt(551),random.nextInt(121),regions.get(random.nextInt(regions.size())),random.nextBoolean()));return rows;}
    public record Request(@NotBlank String rulesetId,@NotBlank String baselineVersion,@NotBlank String candidateVersion,@NotBlank String datasetId,Map<String,@Size(max=80) String> segmentFilters){}
    private static class Segment{int count,changed;BigDecimal base=BigDecimal.ZERO,candidate=BigDecimal.ZERO,impact=BigDecimal.ZERO;void add(BigDecimal a,BigDecimal b,boolean eligibilityChanged,BigDecimal dollars){count++;base=base.add(a);candidate=candidate.add(b);impact=impact.add(dollars);if(eligibilityChanged||a.compareTo(b)!=0)changed++;}Map<String,Object> asMap(String tier){return Map.of("tier",tier,"totalRecords",count,"changedCount",changed,"avgDiscountBaseline",avg(base,count),"avgDiscountCandidate",avg(candidate,count),"netFinancialDelta",impact);}Map<String,Object> asRegion(String region){return Map.of("region",region,"totalRecords",count,"changedCount",changed,"netFinancialDelta",impact);}private BigDecimal avg(BigDecimal n,int d){return d==0?BigDecimal.ZERO:n.divide(BigDecimal.valueOf(d),2,RoundingMode.HALF_UP);}}
}
