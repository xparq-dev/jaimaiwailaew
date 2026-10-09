PRAGMA foreign_keys = ON;

CREATE TABLE admin_authorities (
  user_id TEXT PRIMARY KEY NOT NULL,
  roles_json TEXT NOT NULL CHECK (json_valid(roles_json)),
  active INTEGER NOT NULL CHECK (active IN (0, 1)),
  version INTEGER NOT NULL CHECK (version > 0),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  change_reason TEXT NOT NULL
);

CREATE TABLE tax_rule_governance_events (
  event_id TEXT PRIMARY KEY NOT NULL,
  rule_set_id TEXT NOT NULL,
  version TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  action TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_roles_json TEXT NOT NULL CHECK (json_valid(actor_roles_json)),
  occurred_at TEXT NOT NULL,
  note TEXT NOT NULL,
  snapshot_checksum TEXT,
  UNIQUE (rule_set_id, version, sequence)
);

CREATE INDEX tax_rule_governance_identity_idx
  ON tax_rule_governance_events (rule_set_id, version, sequence);

CREATE TABLE admin_audit_events (
  event_id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  details_json TEXT NOT NULL CHECK (json_valid(details_json)),
  occurred_at TEXT NOT NULL
);

CREATE INDEX admin_audit_occurred_at_idx
  ON admin_audit_events (occurred_at DESC, event_id DESC);

CREATE TRIGGER admin_authority_insert_audit
AFTER INSERT ON admin_authorities
BEGIN
  INSERT INTO admin_audit_events (
    event_id, category, action, actor_id, subject_id, details_json, occurred_at
  ) VALUES (
    'authority:' || NEW.user_id || ':' || NEW.version,
    'authority',
    'authority.assigned',
    NEW.updated_by,
    NEW.user_id,
    json_object(
      'roles', json(NEW.roles_json),
      'active', json(NEW.active),
      'authorityVersion', NEW.version,
      'reason', NEW.change_reason
    ),
    NEW.updated_at
  );
END;

CREATE TRIGGER admin_authority_update_audit
AFTER UPDATE OF roles_json, active, version ON admin_authorities
BEGIN
  INSERT INTO admin_audit_events (
    event_id, category, action, actor_id, subject_id, details_json, occurred_at
  ) VALUES (
    'authority:' || NEW.user_id || ':' || NEW.version,
    'authority',
    CASE WHEN NEW.active = 1 THEN 'authority.updated' ELSE 'authority.revoked' END,
    NEW.updated_by,
    NEW.user_id,
    json_object(
      'roles', json(NEW.roles_json),
      'active', json(NEW.active),
      'authorityVersion', NEW.version,
      'reason', NEW.change_reason
    ),
    NEW.updated_at
  );
END;

CREATE TRIGGER tax_rule_governance_event_audit
AFTER INSERT ON tax_rule_governance_events
BEGIN
  INSERT INTO admin_audit_events (
    event_id, category, action, actor_id, subject_id, details_json, occurred_at
  ) VALUES (
    'governance:' || NEW.event_id,
    'tax_rule_governance',
    'tax_rule.' || NEW.action,
    NEW.actor_id,
    NEW.rule_set_id || '@' || NEW.version,
    json_object(
      'eventId', NEW.event_id,
      'sequence', NEW.sequence,
      'fromStatus', NEW.from_status,
      'toStatus', NEW.to_status
    ),
    NEW.occurred_at
  );
END;
