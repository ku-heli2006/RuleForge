CREATE TABLE rulesets (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    status VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ruleset_versions (
    id BIGSERIAL PRIMARY KEY,
    ruleset_id VARCHAR(64) NOT NULL REFERENCES rulesets(id),
    version VARCHAR(64) NOT NULL,
    content_hash CHAR(64) NOT NULL,
    canonical_document JSONB NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ,
    UNIQUE (ruleset_id, version)
);

CREATE INDEX ruleset_versions_published_idx ON ruleset_versions(ruleset_id, published_at DESC) WHERE is_published;

CREATE TABLE backtest_jobs (
    id VARCHAR(64) PRIMARY KEY,
    ruleset_id VARCHAR(64) NOT NULL REFERENCES rulesets(id),
    baseline_version VARCHAR(64) NOT NULL,
    candidate_version VARCHAR(64) NOT NULL,
    baseline_hash CHAR(64) NOT NULL,
    candidate_hash CHAR(64) NOT NULL,
    dataset_id VARCHAR(120) NOT NULL,
    dataset_hash CHAR(64),
    processing_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(16) NOT NULL,
    summary JSONB,
    error_message VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    FOREIGN KEY (ruleset_id, baseline_version) REFERENCES ruleset_versions(ruleset_id, version),
    FOREIGN KEY (ruleset_id, candidate_version) REFERENCES ruleset_versions(ruleset_id, version)
);
