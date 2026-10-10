PRAGMA foreign_keys = ON;

CREATE TABLE tax_rule_artifacts (
  rule_set_id TEXT NOT NULL,
  version TEXT NOT NULL,
  checksum TEXT NOT NULL CHECK (length(checksum) = 64),
  object_key TEXT NOT NULL UNIQUE,
  tax_year_be INTEGER NOT NULL,
  schema_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  PRIMARY KEY (rule_set_id, version, checksum)
);

CREATE TABLE tax_rule_versions (
  rule_set_id TEXT NOT NULL,
  version TEXT NOT NULL,
  current_checksum TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision > 0),
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  published_checksum TEXT,
  published_at TEXT,
  published_by TEXT,
  PRIMARY KEY (rule_set_id, version),
  FOREIGN KEY (rule_set_id, version, current_checksum)
    REFERENCES tax_rule_artifacts (rule_set_id, version, checksum),
  FOREIGN KEY (rule_set_id, version, published_checksum)
    REFERENCES tax_rule_artifacts (rule_set_id, version, checksum)
);

CREATE INDEX tax_rule_artifacts_created_at_idx
  ON tax_rule_artifacts (created_at DESC, rule_set_id, version);

CREATE TRIGGER tax_rule_artifact_insert_audit
AFTER INSERT ON tax_rule_artifacts
BEGIN
  INSERT INTO admin_audit_events (
    event_id, category, action, actor_id, subject_id, details_json, occurred_at
  ) VALUES (
    'artifact:' || NEW.rule_set_id || ':' || NEW.version || ':' || NEW.checksum,
    'tax_rule_artifact',
    'tax_rule.artifact_stored',
    NEW.created_by,
    NEW.rule_set_id || '@' || NEW.version,
    json_object('checksum', NEW.checksum, 'taxYearBE', NEW.tax_year_be),
    NEW.created_at
  );
END;

CREATE TRIGGER tax_rule_version_insert_audit
AFTER INSERT ON tax_rule_versions
BEGIN
  INSERT INTO admin_audit_events (
    event_id, category, action, actor_id, subject_id, details_json, occurred_at
  ) VALUES (
    'artifact-current:' || NEW.rule_set_id || ':' || NEW.version || ':' || NEW.revision,
    'tax_rule_artifact',
    'tax_rule.current_candidate_changed',
    NEW.updated_by,
    NEW.rule_set_id || '@' || NEW.version,
    json_object('checksum', NEW.current_checksum, 'revision', NEW.revision),
    NEW.updated_at
  );
END;

CREATE TRIGGER tax_rule_version_update_audit
AFTER UPDATE OF current_checksum, revision ON tax_rule_versions
BEGIN
  INSERT INTO admin_audit_events (
    event_id, category, action, actor_id, subject_id, details_json, occurred_at
  ) VALUES (
    'artifact-current:' || NEW.rule_set_id || ':' || NEW.version || ':' || NEW.revision,
    'tax_rule_artifact',
    'tax_rule.current_candidate_changed',
    NEW.updated_by,
    NEW.rule_set_id || '@' || NEW.version,
    json_object('checksum', NEW.current_checksum, 'revision', NEW.revision),
    NEW.updated_at
  );
END;

CREATE TRIGGER tax_rule_publish_artifact_guard
BEFORE INSERT ON tax_rule_governance_events
WHEN NEW.action = 'publish'
BEGIN
  SELECT RAISE(ABORT, 'publish_artifact_not_current')
  WHERE NOT EXISTS (
    SELECT 1 FROM tax_rule_versions
    WHERE rule_set_id = NEW.rule_set_id
      AND version = NEW.version
      AND current_checksum = NEW.snapshot_checksum
      AND published_checksum IS NULL
  );
END;

CREATE TRIGGER tax_rule_publish_artifact_pin
AFTER INSERT ON tax_rule_governance_events
WHEN NEW.action = 'publish'
BEGIN
  UPDATE tax_rule_versions
  SET published_checksum = NEW.snapshot_checksum,
      published_at = NEW.occurred_at,
      published_by = NEW.actor_id
  WHERE rule_set_id = NEW.rule_set_id
    AND version = NEW.version
    AND current_checksum = NEW.snapshot_checksum
    AND published_checksum IS NULL;
END;

CREATE TRIGGER tax_rule_publish_artifact_audit
AFTER UPDATE OF published_checksum ON tax_rule_versions
WHEN NEW.published_checksum IS NOT NULL
BEGIN
  INSERT INTO admin_audit_events (
    event_id, category, action, actor_id, subject_id, details_json, occurred_at
  ) VALUES (
    'artifact-published:' || NEW.rule_set_id || ':' || NEW.version,
    'tax_rule_artifact',
    'tax_rule.artifact_published',
    NEW.published_by,
    NEW.rule_set_id || '@' || NEW.version,
    json_object('checksum', NEW.published_checksum, 'revision', NEW.revision),
    NEW.published_at
  );
END;
