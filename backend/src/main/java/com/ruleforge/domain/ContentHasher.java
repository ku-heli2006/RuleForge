package com.ruleforge.domain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

public final class ContentHasher {
    private final ObjectMapper mapper=new ObjectMapper().configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS,true);
    public String canonical(List<RuleDefinition> rules){
        List<?> normalized=rules.stream().sorted(Comparator.comparing(RuleDefinition::id)).map(r->{
            Map<String,Object> x=new TreeMap<>();x.put("id",r.id());x.put("name",r.name());x.put("description",r.description()==null?"":r.description());x.put("priority",r.priority());x.put("condition",normalizeWhitespace(r.condition()));x.put("enabled",r.enabled());
            var a=r.action();Map<String,Object> action=new TreeMap<>();action.put("discountPercentage",a.discountPercentage()==null?null:a.discountPercentage().stripTrailingZeros());action.put("eligible",a.eligible());action.put("freeShipping",a.freeShipping());action.put("priorityProcessing",a.priorityProcessing());action.put("customTags",a.customTags().stream().sorted().toList());action.put("message",a.message());x.put("action",action);return x;
        }).toList();
        try{return mapper.writeValueAsString(normalized);}catch(JsonProcessingException e){throw new IllegalStateException("Cannot canonicalize ruleset",e);}
    }
    public String hash(List<RuleDefinition> rules){try {byte[] digest=MessageDigest.getInstance("SHA-256").digest(canonical(rules).getBytes(StandardCharsets.UTF_8));return HexFormat.of().formatHex(digest);}catch(Exception e){throw new IllegalStateException("SHA-256 is unavailable",e);}}
    private String normalizeWhitespace(String source){StringBuilder out=new StringBuilder();char quote=0;boolean pending=false;for(int i=0;i<source.length();i++){char c=source.charAt(i);if(quote!=0){out.append(c);if(c==quote&&(i==0||source.charAt(i-1)!='\\'))quote=0;continue;}if(c=='\''||c=='\"'){if(pending&&out.length()>0&&Character.isLetterOrDigit(out.charAt(out.length()-1)))out.append(' ');pending=false;quote=c;out.append(c);continue;}if(Character.isWhitespace(c)){pending=true;continue;}if(pending&&out.length()>0&&Character.isLetterOrDigit(out.charAt(out.length()-1))&&Character.isLetterOrDigit(c))out.append(' ');pending=false;out.append(c);}return out.toString();}
}
