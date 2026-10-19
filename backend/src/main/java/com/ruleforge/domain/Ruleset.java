package com.ruleforge.domain;

import java.time.Instant;
import java.util.List;

public record Ruleset(String id, String name, String description, String version, String status,
                      boolean isDraft, int ruleCount, String latestVerificationStatus,
                      Instant lastUpdated, Instant createdAt, List<RuleDefinition> rules,
                      List<VersionInfo> versions) {
    public Ruleset { rules = List.copyOf(rules); versions = List.copyOf(versions); }
    public record VersionInfo(String version, boolean isDraft, Instant publishedAt, String author,
                              String commitMessage, int ruleCount, String verificationStatus) { }
}
