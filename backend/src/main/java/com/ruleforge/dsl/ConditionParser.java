package com.ruleforge.dsl;

import java.util.*;
import java.util.regex.*;

/** Thread-safe recursive-descent parser; AND binds more tightly than OR. */
public final class ConditionParser {
    private static final Pattern TOKEN = Pattern.compile("\\s*(>=|<=|==|!=|>|<|\\(|\\)|\\bAND\\b|\\bOR\\b|[A-Za-z_][A-Za-z0-9_]*|'[^']*'|\"[^\"]*\"|[+-]?[0-9]+(?:\\.[0-9]+)?)", Pattern.CASE_INSENSITIVE);
    private static final int MAX_TOKENS=512,MAX_DEPTH=32;
    public Condition parse(String source) { return new State(tokenize(source)).parse(); }
    private List<String> tokenize(String s) {
        List<String> out=new ArrayList<>(); Matcher m=TOKEN.matcher(s); int end=0;
        while(m.find()){ if(m.start()!=end) throw new IllegalArgumentException("Invalid condition near character "+end); out.add(m.group(1)); end=m.end(); if(out.size()>MAX_TOKENS)throw new IllegalArgumentException("Condition exceeds the "+MAX_TOKENS+" token limit."); }
        if(end<s.length()&&!s.substring(end).isBlank()) throw new IllegalArgumentException("Invalid condition near character "+end); if(out.isEmpty()) throw new IllegalArgumentException("Condition is empty"); return out;
    }
    private static final class State {
        private final List<String> tokens; private int at,depth;
        private State(List<String> tokens){this.tokens=tokens;}
        private Condition parse(){Condition result=parseOr();if(at!=tokens.size())throw error("Unexpected token '"+peek()+"'");return result;}
        private Condition parseOr(){Condition x=parseAnd();while(take("OR"))x=new Condition.Junction(false,x,parseAnd());return x;}
        private Condition parseAnd(){Condition x=parseAtom();while(take("AND"))x=new Condition.Junction(true,x,parseAtom());return x;}
        private Condition parseAtom(){
            if(take("(")){if(++depth>MAX_DEPTH)throw error("Expression nesting exceeds the "+MAX_DEPTH+" level limit.");Condition x=parseOr();expect(")");depth--;return x;}
            String field=next(),op=next(),value=next();
            if(!Set.of("customerTier","orderAmount","creditScore","customerAge","region","isFirstOrder").contains(field))throw error("Unknown field: "+field);
            if(!Set.of("==","!=",">","<",">=","<=").contains(op))throw error("Expected comparison operator after "+field);
            try{
                if(field.equals("customerTier"))com.ruleforge.domain.BusinessInput.Tier.valueOf(value.toUpperCase(Locale.ROOT));
                else if(field.equals("orderAmount")){var n=new java.math.BigDecimal(value);if(n.signum()<0||n.compareTo(new java.math.BigDecimal("1000000"))>0||n.scale()>2)throw new IllegalArgumentException();}
                else if(field.equals("creditScore")){int n=Integer.parseInt(value);if(n<300||n>850)throw new IllegalArgumentException();}
                else if(field.equals("customerAge")){int n=Integer.parseInt(value);if(n<0||n>120)throw new IllegalArgumentException();}
                else if(field.equals("isFirstOrder")&&!Set.of("true","false").contains(value.toLowerCase(Locale.ROOT)))throw new IllegalArgumentException();
                else if(field.equals("region")&&!strip(value).matches("[A-Za-z0-9_-]{1,40}"))throw new IllegalArgumentException();
            }catch(RuntimeException e){throw error("Invalid literal '"+value+"' for field "+field);}
            if((field.equals("region")||field.equals("customerTier")||field.equals("isFirstOrder"))&&!op.equals("==")&&!op.equals("!="))throw error("Operator "+op+" is not supported for "+field);
            return new Condition.Compare(field,op,value);
        }
        private String next(){if(at>=tokens.size())throw error("Unexpected end of condition");return tokens.get(at++);}
        private String peek(){return at<tokens.size()?tokens.get(at):"<end>";}
        private boolean take(String s){if(at<tokens.size()&&tokens.get(at).equalsIgnoreCase(s)){at++;return true;}return false;}
        private void expect(String s){if(!take(s))throw error("Expected '"+s+"'");}
        private String strip(String s){return s.length()>1&&(s.startsWith("'")||s.startsWith("\""))?s.substring(1,s.length()-1):s;}
        private IllegalArgumentException error(String m){return new IllegalArgumentException(m+" at token "+(at+1));}
    }
}
