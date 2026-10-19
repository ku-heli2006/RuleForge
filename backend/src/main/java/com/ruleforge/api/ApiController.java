package com.ruleforge.api;

import com.ruleforge.domain.*;
import com.ruleforge.dsl.ConditionParser;
import com.ruleforge.engine.EvaluationService;
import com.ruleforge.persistence.RulesetStore;
import com.ruleforge.verification.Z3Verifier;
import com.ruleforge.backtesting.BacktestService;
import com.ruleforge.counterfactual.CounterfactualService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class ApiController {
    private static final Instant STARTED=Instant.now();
    private final RulesetStore store; private final EvaluationService evaluator; private final Z3Verifier verifier; private final BacktestService backtests; private final CounterfactualService counterfactuals; private final ConditionParser parser=new ConditionParser();
    public ApiController(RulesetStore store,EvaluationService evaluator,Z3Verifier verifier,BacktestService backtests,CounterfactualService counterfactuals){this.store=store;this.evaluator=evaluator;this.verifier=verifier;this.backtests=backtests;this.counterfactuals=counterfactuals;}
    @GetMapping("/health") public Map<String,Object> health(){boolean solverAvailable=verifier.available();return Map.of("status",solverAvailable?"UP":"DEGRADED","version","0.1.0","solver",Map.of("name","Z3","version","4.13.4","available",solverAvailable),"uptimeSeconds",Duration.between(STARTED,Instant.now()).getSeconds(),"timestamp",Instant.now());}
    @GetMapping("/rulesets") public List<Ruleset> list(){return store.list();}
    @PostMapping("/rulesets") public ResponseEntity<Ruleset> create(@Valid @RequestBody CreateRequest req){return ResponseEntity.status(201).body(store.create(req.name(),req.description(),req.initialRules()==null?List.of():req.initialRules()));}
    @GetMapping("/rulesets/{id}") public Ruleset get(@PathVariable String id){return store.get(id).orElseThrow(()->new NoSuchElementException("Ruleset not found: "+id));}
    @PutMapping("/rulesets/{id}") public Ruleset update(@PathVariable String id,@Valid @RequestBody UpdateRequest req){if(req.status()!=null&&!Set.of("DRAFT","PUBLISHED").contains(req.status()))throw new IllegalArgumentException("Unsupported ruleset status: "+req.status());Ruleset current=get(id);if("DRAFT".equals(req.status())&&!current.isDraft()){store.duplicate(id,current.version());return store.update(id,req.name(),req.description(),req.rules());}Ruleset rs=store.update(id,req.name(),req.description(),req.rules());if("PUBLISHED".equals(req.status())){ValidationResponse v=validate(id,new ValidationRequest(rs.rules()));if(!v.valid())throw new IllegalArgumentException("Ruleset validation failed before publication.");return store.publish(id);}return rs;}
    @GetMapping("/rulesets/{id}/versions") public List<Ruleset.VersionInfo> versions(@PathVariable String id){return get(id).versions();}
    @GetMapping("/rulesets/{id}/versions/{version}") public Ruleset getVersion(@PathVariable String id,@PathVariable String version){return store.getVersion(id,version).orElseThrow(()->new NoSuchElementException("Ruleset version not found: "+version));}
    @PostMapping("/rulesets/{id}/versions/{version}/duplicate") public Ruleset duplicate(@PathVariable String id,@PathVariable String version){return store.duplicate(id,version);}
    @PostMapping("/rulesets/{id}/validate") public ValidationResponse validate(@PathVariable String id,@Valid @RequestBody ValidationRequest req){Ruleset rs=get(id); List<RuleDefinition> rules=req.rules()==null?rs.rules():req.rules(); var errors=new ArrayList<Map<String,Object>>(); Set<String> ids=new HashSet<>();if(rules.size()>200)errors.add(err("","rules","Ruleset exceeds the 200 rule limit.")); for(var r:rules){try{parser.parse(r.condition()); if(!ids.add(r.id())) errors.add(err(r.id(),"id","Duplicate rule ID."));var a=r.action();if(a.discountPercentage()==null&&a.eligible()==null&&a.freeShipping()==null&&a.priorityProcessing()==null&&a.customTags().isEmpty()&&(a.message()==null||a.message().isBlank()))errors.add(err(r.id(),"action","At least one action field is required."));}catch(Exception e){errors.add(err(r.id(),"condition",e.getMessage()));}} return new ValidationResponse(errors.isEmpty(),errors,List.of(),rules.size());}
    @PostMapping("/rulesets/{id}/publish") public Ruleset publish(@PathVariable String id){Ruleset rs=get(id);ValidationResponse v=validate(id,new ValidationRequest(rs.rules()));if(!v.valid())throw new IllegalArgumentException("Ruleset validation failed before publication.");return store.publish(id);}
    @PostMapping("/rulesets/{id}/evaluate") public EvaluationService.Result evaluate(@PathVariable String id,@Valid @RequestBody EvaluateRequest req){Ruleset latest=get(id); String version=req.version()==null?latest.version():req.version();Ruleset rs=store.getVersion(id,version).orElseThrow(()->new NoSuchElementException("Ruleset version not found: "+version));return evaluator.evaluate(id,version,rs.rules(),req.input());}
    @PostMapping("/rulesets/{id}/verify") public Z3Verifier.VerificationResponse verify(@PathVariable String id,@RequestBody(required=false) Map<String,Object> body){Ruleset latest=get(id);String version=body!=null&&body.get("version") instanceof String s?s:body!=null&&body.get("versionId") instanceof String s?s:latest.version();Ruleset rs=store.getVersion(id,version).orElseThrow(()->new NoSuchElementException("Ruleset version not found: "+version)); Integer timeout=null; Set<String> checks=new HashSet<>(List.of("OVERLAP","CONFLICT","UNREACHABLE","SHADOWED"));if(body!=null&&body.get("options") instanceof Map<?,?> options){if(options.get("solverTimeoutMs") instanceof Number n)timeout=n.intValue();checks.clear();if(!Boolean.FALSE.equals(options.get("checkOverlap")))checks.add("OVERLAP");if(!Boolean.FALSE.equals(options.get("checkConflict")))checks.add("CONFLICT");if(!Boolean.FALSE.equals(options.get("checkUnreachable")))checks.add("UNREACHABLE");if(!Boolean.FALSE.equals(options.get("checkShadowed")))checks.add("SHADOWED");}if(body!=null&&body.get("checks") instanceof List<?> list){checks.clear();for(Object x:list)if(x instanceof String s)checks.add(s.toUpperCase(Locale.ROOT));}return verifier.verify(id,rs.version(),rs.rules(),timeout,checks);}
    @PostMapping("/rulesets/{id}/counterfactual") public Map<String,Object> counterfactual(@PathVariable String id,@Valid @RequestBody CounterfactualService.Request request){return counterfactuals.search(id,request);}
    @PostMapping("/backtests") public ResponseEntity<Map<String,Object>> runBacktest(@Valid @RequestBody BacktestService.Request request){return ResponseEntity.status(201).body(backtests.run(request));}
    @GetMapping("/backtests/{id}") public Map<String,Object> getBacktest(@PathVariable String id){return backtests.get(id);}
    @GetMapping(value="/backtests/{id}/export",produces="text/csv") public ResponseEntity<String> exportBacktest(@PathVariable String id){return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=ruleforge_backtest_"+id+".csv").contentType(MediaType.parseMediaType("text/csv; charset=UTF-8")).body(backtests.csv(id));}
    private Map<String,Object> err(String id,String field,String msg){return Map.of("ruleId",id,"field",field,"message",msg,"severity","ERROR");}
    public record CreateRequest(@NotBlank @Size(max=120) String name,@Size(max=500) String description,@Size(max=200) List<@Valid RuleDefinition> initialRules){}
    public record UpdateRequest(@Size(max=120) String name,@Size(max=500) String description,@Size(max=200) List<@Valid RuleDefinition> rules,String status){}
    public record ValidationRequest(@Size(max=200) List<@Valid RuleDefinition> rules){}
    public record EvaluateRequest(@NotNull @Valid BusinessInput input,String version){}
    public record ValidationResponse(boolean valid,List<Map<String,Object>> errors,List<Object> warnings,int parsedRulesCount){}
}
