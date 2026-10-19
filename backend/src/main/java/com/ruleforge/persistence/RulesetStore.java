package com.ruleforge.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ruleforge.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

@Service
public class RulesetStore {
    private static final TypeReference<List<RuleDefinition>> RULE_LIST=new TypeReference<>(){};
    private final JdbcTemplate jdbc; private final ObjectMapper json; private final ContentHasher hasher=new ContentHasher();
    public RulesetStore(JdbcTemplate jdbc,ObjectMapper json){this.jdbc=jdbc;this.json=json;}
    public List<Ruleset> list(){List<String> ids=jdbc.query("SELECT id FROM rulesets ORDER BY created_at",(rs,n)->rs.getString(1));return ids.stream().map(id->get(id).orElseThrow()).toList();}
    public Optional<Ruleset> get(String id){
        var rows=jdbc.query("SELECT id,name,description,status,created_at,updated_at FROM rulesets WHERE id=?",(rs,n)->new Object[]{rs.getString(1),rs.getString(2),rs.getString(3),rs.getString(4),rs.getTimestamp(5).toInstant(),rs.getTimestamp(6).toInstant()},id);
        if(rows.isEmpty())return Optional.empty();Object[] meta=rows.getFirst();
        var versions=jdbc.query("SELECT version,is_published,published_at,canonical_document::text,created_at FROM ruleset_versions WHERE ruleset_id=? ORDER BY id DESC",(rs,n)->new Object[]{rs.getString(1),rs.getBoolean(2),rs.getTimestamp(3)==null?null:rs.getTimestamp(3).toInstant(),rs.getString(4),rs.getTimestamp(5).toInstant()},id);
        if(versions.isEmpty())return Optional.empty();Object[] current=versions.getFirst();
        try{
            List<RuleDefinition> rules=json.readValue((String)current[3],RULE_LIST);
            List<Ruleset.VersionInfo> info=versions.stream().map(v->{Object[] x=(Object[])v; try {var rs=json.readValue((String)x[3],RULE_LIST);return new Ruleset.VersionInfo((String)x[0],!(Boolean)x[1],(Instant)x[2],"local",(Boolean)x[1]?"Published version":"Draft",rs.size(),"UNVERIFIED");}catch(Exception e){throw new IllegalStateException(e);}}).toList();
            String version=(String)current[0];boolean draft=!(Boolean)current[1];
            return Optional.of(new Ruleset((String)meta[0],(String)meta[1],(String)meta[2],version,draft?"DRAFT":"PUBLISHED",draft,rules.size(),"UNVERIFIED",(Instant)meta[5],(Instant)meta[4],rules,info));
        }catch(Exception e){throw new IllegalStateException("Stored ruleset document could not be read",e);}
    }
    public Optional<Ruleset> getVersion(String id,String version){
        Ruleset meta=get(id).orElse(null);if(meta==null)return Optional.empty();
        var row=jdbc.query("SELECT canonical_document::text,is_published FROM ruleset_versions WHERE ruleset_id=? AND version=?",(rs,n)->new Object[]{rs.getString(1),rs.getBoolean(2)},id,version);
        if(row.isEmpty())return Optional.empty();try{Object[] x=row.getFirst();List<RuleDefinition> rules=json.readValue((String)x[0],RULE_LIST);return Optional.of(new Ruleset(meta.id(),meta.name(),meta.description(),version,(Boolean)x[1]?"PUBLISHED":"DRAFT",!(Boolean)x[1],rules.size(),meta.latestVerificationStatus(),meta.lastUpdated(),meta.createdAt(),rules,meta.versions()));}catch(Exception e){throw new IllegalStateException("Stored ruleset version could not be read",e);}
    }
    @Transactional public Ruleset create(String name,String description,List<RuleDefinition> rules){
        return create("rs-"+UUID.randomUUID().toString().substring(0,8),name,description,rules);
    }
    @Transactional public Ruleset create(String id,String name,String description,List<RuleDefinition> rules){
        Instant now=Instant.now();List<RuleDefinition> actual=List.copyOf(rules);
        jdbc.update("INSERT INTO rulesets(id,name,description,status,created_at,updated_at) VALUES(?,?,?,'DRAFT',?,?)",id,name,description==null?"":description,Timestamp.from(now),Timestamp.from(now));
        insertVersion(id,"draft-1",actual,false,null);return get(id).orElseThrow();
    }
    @Transactional public Ruleset update(String id,String name,String description,List<RuleDefinition> rules){
        jdbc.query("SELECT id FROM rulesets WHERE id=? FOR UPDATE",rs->{},id);
        Ruleset old=require(id);if(!old.isDraft())throw new IllegalStateException("Published rulesets cannot be edited; duplicate a version into a new draft.");
        if(name!=null)jdbc.update("UPDATE rulesets SET name=?,updated_at=? WHERE id=?",name,Timestamp.from(Instant.now()),id);
        if(description!=null)jdbc.update("UPDATE rulesets SET description=?,updated_at=? WHERE id=?",description,Timestamp.from(Instant.now()),id);
        if(rules!=null){String document=hasher.canonical(rules),hash=hasher.hash(rules);int changed=jdbc.update("UPDATE ruleset_versions SET canonical_document=?::jsonb,content_hash=?,created_at=? WHERE ruleset_id=? AND is_published=FALSE AND version=?",document,hash,Timestamp.from(Instant.now()),id,old.version());if(changed!=1)throw new IllegalStateException("Draft changed concurrently or is no longer editable.");}
        return get(id).orElseThrow();
    }
    @Transactional public Ruleset publish(String id){
        jdbc.query("SELECT id FROM rulesets WHERE id=? FOR UPDATE",rs->{},id);
        Ruleset old=require(id);if(!old.isDraft())throw new IllegalStateException("Ruleset is already published.");if(old.rules().isEmpty())throw new IllegalArgumentException("Ruleset must contain at least one rule.");
        int next=1+jdbc.queryForObject("SELECT COUNT(*) FROM ruleset_versions WHERE ruleset_id=? AND is_published=TRUE",Integer.class,id);
        String version="1."+Math.max(0,next-1)+".0";Instant now=Instant.now();
        int changed=jdbc.update("UPDATE ruleset_versions SET version=?,is_published=TRUE,published_at=?,created_at=? WHERE ruleset_id=? AND is_published=FALSE AND version=?",version,Timestamp.from(now),Timestamp.from(now),id,old.version());
        if(changed!=1)throw new IllegalStateException("Draft changed concurrently or is no longer publishable.");
        jdbc.update("UPDATE rulesets SET status='PUBLISHED',updated_at=? WHERE id=?",Timestamp.from(now),id);return get(id).orElseThrow();
    }
    @Transactional public Ruleset duplicate(String id,String version){
        jdbc.query("SELECT id FROM rulesets WHERE id=? FOR UPDATE",rs->{},id);
        if(require(id).isDraft())throw new IllegalStateException("A draft already exists for this ruleset.");
        Ruleset source=getVersion(id,version).orElseThrow(()->new NoSuchElementException("Ruleset version not found: "+version));
        String draft="draft-"+UUID.randomUUID().toString().substring(0,8);Instant now=Instant.now();
        jdbc.update("UPDATE rulesets SET status='DRAFT',updated_at=? WHERE id=?",Timestamp.from(now),id);insertVersion(id,draft,source.rules(),false,null);return get(id).orElseThrow();
    }
    private void insertVersion(String id,String version,List<RuleDefinition> rules,boolean published,Instant at){String doc=hasher.canonical(rules);Instant createdAt=Instant.now();jdbc.update("INSERT INTO ruleset_versions(ruleset_id,version,content_hash,canonical_document,is_published,published_at,created_at) VALUES(?,?,?,?::jsonb,?,?,?)",id,version,hasher.hash(rules),doc,published,at==null?null:Timestamp.from(at),Timestamp.from(createdAt));}
    private Ruleset require(String id){return get(id).orElseThrow(()->new NoSuchElementException("Ruleset not found: "+id));}
}
