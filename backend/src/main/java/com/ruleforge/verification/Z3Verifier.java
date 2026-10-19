package com.ruleforge.verification;

import com.microsoft.z3.*;
import com.ruleforge.domain.*;
import com.ruleforge.dsl.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/** Z3 translation for the bounded business-input domain. Each check owns and closes its native context. */
@Service
public class Z3Verifier {
    private final ConditionParser parser=new ConditionParser();
    private static final List<String> TIERS=List.of("BRONZE","SILVER","GOLD","PLATINUM");
    private record Vars(IntExpr tier,IntExpr amount,IntExpr score,IntExpr age,IntExpr region,BoolExpr first,Map<String,Integer> regionCodes) { }
    public boolean available(){try(Context ignored=new Context()){return true;}catch(LinkageError|RuntimeException e){return false;}}
    public VerificationResponse verify(String rulesetId,String version,List<RuleDefinition> rules,Integer timeoutOverride){return verify(rulesetId,version,rules,timeoutOverride,Set.of("OVERLAP","CONFLICT","UNREACHABLE","SHADOWED"));}
    public VerificationResponse verify(String rulesetId,String version,List<RuleDefinition> rules,Integer timeoutOverride,Set<String> checks){
        long start=System.nanoTime(); String run=UUID.randomUUID().toString(); int timeout=timeoutOverride==null?3000:Math.max(1,Math.min(timeoutOverride,10000));long deadline=start+15_000_000_000L;boolean budgetExhausted=false;
        var findings=new ArrayList<Finding>();boolean hasSatCheck=false;
        List<RuleDefinition> active=rules.stream().filter(RuleDefinition::enabled).toList();
        if(checks.contains("OVERLAP")||checks.contains("CONFLICT")) pairChecks: for(int i=0;i<active.size();i++) for(int j=i+1;j<active.size();j++) {
            int left=remaining(timeout,deadline);if(left==0){budgetExhausted=true;break pairChecks;}
            var a=active.get(i);var b=active.get(j); Condition ca=parser.parse(a.condition()),cb=parser.parse(b.condition());
            var overlap=check(List.of(ca,cb),active,left);
            if(checks.contains("OVERLAP")&&overlap.status==SolverStatus.SAT)hasSatCheck=true;
            if(checks.contains("OVERLAP")&&overlap.status!=SolverStatus.UNSAT) findings.add(new Finding("F-"+UUID.randomUUID(),"OVERLAP",List.of(a.id(),b.id()),overlap.status.name(),overlap.status==SolverStatus.SAT?"WARNING":"INFO",overlap.status==SolverStatus.SAT?"Both conditions can match the same valid input.":"Solver could not establish whether these conditions overlap.",overlap.witness,run,Instant.now(),details(a,b)));
            List<String> conflictingFields=checks.contains("CONFLICT")&&a.priority()==b.priority()?conflictingFields(a.action(),b.action()):List.of();
            if(!conflictingFields.isEmpty()&&overlap.status!=SolverStatus.UNSAT){int conflictBudget=remaining(timeout,deadline);Checked conflictCheck=conflictBudget==0?new Checked(SolverStatus.UNKNOWN,null,assumptions()):check(List.of(conflictPredicate(a,b,active,conflictingFields,ca,cb)),active,conflictBudget);
                if(conflictBudget==0)budgetExhausted=true;
                if(conflictCheck.status==SolverStatus.SAT){hasSatCheck=true;findings.add(new Finding("F-"+UUID.randomUUID(),"CONFLICT",List.of(a.id(),b.id()),"SAT","CRITICAL","Same-priority rules can assign incompatible values to the same output when no higher-priority rule suppresses those assignments.",conflictCheck.witness,run,Instant.now(),details(a,b)));}
                else if(conflictCheck.status==SolverStatus.UNKNOWN)findings.add(new Finding("F-"+UUID.randomUUID(),"CONFLICT",List.of(a.id(),b.id()),"UNKNOWN","INFO","Solver could not determine whether the incompatible same-priority actions can affect the final outcome.",null,run,Instant.now(),details(a,b)));
            }
        }
        if(checks.contains("UNREACHABLE"))for(var r:active){int left=remaining(timeout,deadline);if(left==0){budgetExhausted=true;break;}var result=check(List.of(parser.parse(r.condition())),active,left);if(result.status==SolverStatus.SAT)hasSatCheck=true; if(result.status==SolverStatus.UNSAT) findings.add(new Finding("F-"+UUID.randomUUID(),"UNREACHABLE",List.of(r.id()),"UNSAT","WARNING","No input in the encoded business domain satisfies this rule.",null,run,Instant.now(),Map.of("conditions",List.of(Map.of("ruleId",r.id(),"condition",r.condition())),"assumptions",result.assumptions))); else if(result.status==SolverStatus.UNKNOWN) findings.add(new Finding("F-"+UUID.randomUUID(),"UNREACHABLE",List.of(r.id()),"UNKNOWN","INFO","Solver could not establish reachability before its resource limit.",null,run,Instant.now(),Map.of("solverDiagnostics",List.of("Z3 returned unknown.")))); }
        if(checks.contains("SHADOWED"))for(var r:active){ boolean canInfluence=false,unknownInfluence=false; Condition own=parser.parse(r.condition());
            for(String field:List.of("discountPercentage","eligible","freeShipping","priorityProcessing","customTags","message")) if(actionValue(r.action(),field)!=null){
                List<Condition> blocked=new ArrayList<>();blocked.add(own);
                for(var higher:active) if(higher.priority()<r.priority()&&actionValue(higher.action(),field)!=null) blocked.add(new Condition.Negation(parser.parse(higher.condition())));
                int left=remaining(timeout,deadline);if(left==0){budgetExhausted=true;unknownInfluence=true;break;}SolverStatus status=check(blocked,active,left).status; if(status==SolverStatus.SAT){canInfluence=true;hasSatCheck=true;} if(status==SolverStatus.UNKNOWN)unknownInfluence=true;
            }
            if(!canInfluence&&!unknownInfluence) {int left=remaining(timeout,deadline);if(left==0){budgetExhausted=true;unknownInfluence=true;}else{var res=check(List.of(own),active,left);if(res.status==SolverStatus.SAT)findings.add(new Finding("F-"+UUID.randomUUID(),"SHADOWED",List.of(r.id()),"UNSAT","WARNING","No valid input lets this rule affect an assigned output under the encoded priority policy.",null,run,Instant.now(),Map.of("conditions",List.of(Map.of("ruleId",r.id(),"condition",r.condition())),"assumptions",res.assumptions)));else if(res.status==SolverStatus.UNKNOWN)unknownInfluence=true;}}
            if(unknownInfluence)findings.add(new Finding("F-"+UUID.randomUUID(),"SHADOWED",List.of(r.id()),"UNKNOWN","INFO","Solver could not establish whether this rule can affect any assigned output.",null,run,Instant.now(),Map.of("solverDiagnostics",List.of("Solver timeout or verification budget reached."))));
        }
        boolean hasUnknown=budgetExhausted||findings.stream().anyMatch(f->f.solverResult().equals("UNKNOWN"));
        String overall=checks.isEmpty()||hasUnknown?"UNKNOWN":hasSatCheck?"SAT":"UNSAT";
        Map<String,Integer> summary=Map.of("totalFindings",findings.size(),"overlapCount",count(findings,"OVERLAP"),"conflictCount",count(findings,"CONFLICT"),"unreachableCount",count(findings,"UNREACHABLE"),"shadowedCount",count(findings,"SHADOWED"));
        List<String> diagnostics=budgetExhausted?List.of("Global verification budget of 15000 ms reached; some checks may be incomplete."):checks.isEmpty()?List.of("No verification checks were requested."):List.of();
        return new VerificationResponse(rulesetId,version,"Z3 4.13.4",overall,List.copyOf(findings),summary,diagnostics,(System.nanoTime()-start)/1_000_000.0,run,Instant.now());
    }
    private int remaining(int configured,long deadline){long left=(deadline-System.nanoTime())/1_000_000L;return left<=0?0:(int)Math.min(configured,left);}
    private int count(List<Finding> f,String type){return (int)f.stream().filter(x->x.type().equals(type)).count();}
    private List<String> conflictingFields(RuleDefinition.Action a,RuleDefinition.Action b){List<String> fields=new ArrayList<>();for(String f:List.of("discountPercentage","eligible","freeShipping","priorityProcessing")){Object x=actionValue(a,f),y=actionValue(b,f);if(x instanceof BigDecimal n&&y instanceof BigDecimal m){if(n.compareTo(m)!=0)fields.add(f);}else if(x!=null&&y!=null&&!x.equals(y))fields.add(f);}return fields;}
    private Condition conflictPredicate(RuleDefinition a,RuleDefinition b,List<RuleDefinition> rules,List<String> fields,Condition ca,Condition cb){Condition any=null;for(String field:fields){List<Condition> terms=new ArrayList<>(List.of(ca,cb));for(var higher:rules)if(higher.priority()<a.priority()&&actionValue(higher.action(),field)!=null)terms.add(new Condition.Negation(parser.parse(higher.condition())));Condition path=terms.getFirst();for(int i=1;i<terms.size();i++)path=new Condition.Junction(true,path,terms.get(i));any=any==null?path:new Condition.Junction(false,any,path);}return any;}
    private Object actionValue(RuleDefinition.Action a,String field){return switch(field){case "discountPercentage"->a.discountPercentage();case "eligible"->a.eligible();case "freeShipping"->a.freeShipping();case "priorityProcessing"->a.priorityProcessing();case "customTags"->a.customTags().isEmpty()?null:a.customTags();case "message"->a.message()==null||a.message().isBlank()?null:a.message();default->null;};}
    private String otherRegion(Map<String,Integer> known){String value="OTHER";int suffix=1;while(known.containsKey(value))value="OTHER_"+(suffix++);return value;}
    private Map<String,Object> details(RuleDefinition a,RuleDefinition b){return Map.of("conditions",List.of(Map.of("ruleId",a.id(),"condition",a.condition()),Map.of("ruleId",b.id(),"condition",b.condition())),"actions",List.of(Map.of("ruleId",a.id(),"action",a.action()),Map.of("ruleId",b.id(),"action",b.action())),"assumptions",List.of("orderAmount is represented in cents and bounded to 0..1000000.00","creditScore is 300..850","customerAge is 0..120","customerTier is BRONZE, SILVER, GOLD, or PLATINUM"));}
    private record Checked(SolverStatus status,Map<String,Object> witness,List<String> assumptions) { }
    private enum SolverStatus { SAT,UNSAT,UNKNOWN }
    private Checked check(List<Condition> conditions,List<RuleDefinition> rules,int timeout){
        try(Context ctx=new Context()){
            Map<String,Integer> regions=new LinkedHashMap<>(); for(var r:rules) collectRegions(parser.parse(r.condition()),regions);
            Vars v=new Vars(ctx.mkIntConst("customerTier"),ctx.mkIntConst("orderAmountCents"),ctx.mkIntConst("creditScore"),ctx.mkIntConst("customerAge"),ctx.mkIntConst("region"),ctx.mkBoolConst("isFirstOrder"),regions);
            Solver solver=ctx.mkSolver(); Params params=ctx.mkParams();params.add("timeout",timeout);solver.setParameters(params);
            solver.add(ctx.mkGe(v.tier(),ctx.mkInt(0)),ctx.mkLe(v.tier(),ctx.mkInt(3)),ctx.mkGe(v.amount(),ctx.mkInt(0)),ctx.mkLe(v.amount(),ctx.mkInt(100000000)),ctx.mkGe(v.score(),ctx.mkInt(300)),ctx.mkLe(v.score(),ctx.mkInt(850)),ctx.mkGe(v.age(),ctx.mkInt(0)),ctx.mkLe(v.age(),ctx.mkInt(120)));
            for(Condition c:conditions)solver.add(translate(ctx,c,v));
            Status status=solver.check(); if(status==Status.UNSATISFIABLE)return new Checked(SolverStatus.UNSAT,null,assumptions()); if(status==Status.UNKNOWN)return new Checked(SolverStatus.UNKNOWN,null,assumptions());
            Model model=solver.getModel(); Map<String,Object> witness=new LinkedHashMap<>();int tier=asInt(model.eval(v.tier(),true)); int cents=asInt(model.eval(v.amount(),true));int regionCode=asInt(model.eval(v.region(),true));
            witness.put("customerTier",TIERS.get(tier));witness.put("orderAmount",new BigDecimal(cents).movePointLeft(2));witness.put("creditScore",asInt(model.eval(v.score(),true)));witness.put("customerAge",asInt(model.eval(v.age(),true)));witness.put("region",v.regionCodes().entrySet().stream().filter(e->e.getValue()==regionCode).map(Map.Entry::getKey).findFirst().orElseGet(()->otherRegion(v.regionCodes())));witness.put("isFirstOrder",model.eval(v.first(),true).isTrue());
            return new Checked(SolverStatus.SAT,witness,assumptions());
        }
    }
    private int asInt(Expr<?> e){return ((IntNum)e).getInt();}
    private List<String> assumptions(){return List.of("orderAmount is scaled to integer cents and ranges from 0.00 to 1000000.00","creditScore ranges from 300 to 850","customerAge ranges from 0 to 120","customerTier is one of BRONZE, SILVER, GOLD, PLATINUM","region comparisons use distinct codes for string literals found in the ruleset");}
    private void collectRegions(Condition c,Map<String,Integer> map){if(c instanceof Condition.Compare x&&x.field().equals("region")){String s=strip(x.literal());map.computeIfAbsent(s,k->map.size()+1);}else if(c instanceof Condition.Junction j){collectRegions(j.left(),map);collectRegions(j.right(),map);}else if(c instanceof Condition.Negation n)collectRegions(n.value(),map);}
    private BoolExpr translate(Context c,Condition node,Vars v){
        if(node instanceof Condition.Junction j)return j.and()?c.mkAnd(translate(c,j.left(),v),translate(c,j.right(),v)):c.mkOr(translate(c,j.left(),v),translate(c,j.right(),v));
        if(node instanceof Condition.Negation n)return c.mkNot(translate(c,n.value(),v));
        var x=(Condition.Compare)node; Expr<?> lhs;Expr<?> rhs;
        switch(x.field()){
            case "customerTier"->{lhs=v.tier();rhs=c.mkInt(TIERS.indexOf(x.literal().toUpperCase(Locale.ROOT)));}
            case "orderAmount"->{lhs=v.amount();rhs=c.mkInt(new BigDecimal(x.literal()).movePointRight(2).intValueExact());}
            case "creditScore"->{lhs=v.score();rhs=c.mkInt(Integer.parseInt(x.literal()));}
            case "customerAge"->{lhs=v.age();rhs=c.mkInt(Integer.parseInt(x.literal()));}
            case "region"->{lhs=v.region();rhs=c.mkInt(v.regionCodes().getOrDefault(strip(x.literal()),0));}
            case "isFirstOrder"->{lhs=v.first();rhs=c.mkBool(Boolean.parseBoolean(x.literal()));}
            default->throw new IllegalArgumentException("Unsupported field: "+x.field());
        }
        return switch(x.operator()){case "=="->c.mkEq(lhs,rhs);case "!="->c.mkNot(c.mkEq(lhs,rhs));case ">"->c.mkGt((ArithExpr<?>)lhs,(ArithExpr<?>)rhs);case "<"->c.mkLt((ArithExpr<?>)lhs,(ArithExpr<?>)rhs);case ">="->c.mkGe((ArithExpr<?>)lhs,(ArithExpr<?>)rhs);case "<="->c.mkLe((ArithExpr<?>)lhs,(ArithExpr<?>)rhs);default->throw new IllegalArgumentException("Unsupported operator");};
    }
    private String strip(String s){return s.length()>1&&(s.startsWith("'")||s.startsWith("\""))?s.substring(1,s.length()-1):s;}
    public record VerificationResponse(String rulesetId,String version,String solver,String solverStatus,List<Finding> findings,Map<String,Integer> summary,List<String> diagnostics,double verificationDurationMs,String runId,Instant timestamp){}
    public record Finding(String id,String type,List<String> ruleIds,String solverResult,String severity,String explanation,Map<String,Object> witnessInput,String runId,Instant timestamp,Map<String,Object> details){}
}
