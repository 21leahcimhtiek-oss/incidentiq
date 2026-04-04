-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ORGS TABLE
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- USERS TABLE (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'responder', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INCIDENTS TABLE
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('P0', 'P1', 'P2', 'P3')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  ai_severity_suggestion TEXT CHECK (ai_severity_suggestion IN ('P0', 'P1', 'P2', 'P3')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- INCIDENT UPDATES TABLE
CREATE TABLE incident_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ONCALL SCHEDULES TABLE
CREATE TABLE oncall_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  rotation_type TEXT NOT NULL DEFAULT 'weekly' CHECK (rotation_type IN ('daily', 'weekly', 'custom')),
  CONSTRAINT valid_schedule_range CHECK (end_at > start_at)
);

-- POSTMORTEMS TABLE
CREATE TABLE postmortems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  content_md TEXT NOT NULL DEFAULT '',
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ALERTS TABLE
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  severity TEXT CHECK (severity IN ('P0', 'P1', 'P2', 'P3')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INTEGRATIONS TABLE
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pagerduty', 'slack', 'opsgenie')),
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(org_id, type)
);

-- INDEXES
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_incidents_org_id ON incidents(org_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incident_updates_incident_id ON incident_updates(incident_id);
CREATE INDEX idx_oncall_schedules_org_id ON oncall_schedules(org_id);
CREATE INDEX idx_oncall_schedules_time ON oncall_schedules(start_at, end_at);
CREATE INDEX idx_postmortems_incident_id ON postmortems(incident_id);
CREATE INDEX idx_alerts_org_id ON alerts(org_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_integrations_org_id ON integrations(org_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE oncall_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE postmortems ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTION: get current user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- HELPER FUNCTION: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS POLICIES: ORGS
CREATE POLICY "Users can view their own org" ON orgs
  FOR SELECT USING (id = get_user_org_id());
CREATE POLICY "Admins can update their org" ON orgs
  FOR UPDATE USING (id = get_user_org_id() AND get_user_role() = 'admin');

-- RLS POLICIES: USERS
CREATE POLICY "Users can view members of their org" ON users
  FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Admins can insert users into their org" ON users
  FOR INSERT WITH CHECK (org_id = get_user_org_id() AND get_user_role() = 'admin');
CREATE POLICY "Admins can update users in their org" ON users
  FOR UPDATE USING (org_id = get_user_org_id() AND get_user_role() = 'admin');
CREATE POLICY "Admins can delete users from their org" ON users
  FOR DELETE USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- RLS POLICIES: INCIDENTS
CREATE POLICY "Org members can view incidents" ON incidents
  FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Admins and responders can create incidents" ON incidents
  FOR INSERT WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'responder'));
CREATE POLICY "Admins and responders can update incidents" ON incidents
  FOR UPDATE USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'responder'));
CREATE POLICY "Admins can delete incidents" ON incidents
  FOR DELETE USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- RLS POLICIES: INCIDENT UPDATES
CREATE POLICY "Org members can view incident updates" ON incident_updates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM incidents i WHERE i.id = incident_id AND i.org_id = get_user_org_id())
  );
CREATE POLICY "Admins and responders can create incident updates" ON incident_updates
  FOR INSERT WITH CHECK (
    get_user_role() IN ('admin', 'responder') AND
    EXISTS (SELECT 1 FROM incidents i WHERE i.id = incident_id AND i.org_id = get_user_org_id())
  );

-- RLS POLICIES: ONCALL SCHEDULES
CREATE POLICY "Org members can view oncall schedules" ON oncall_schedules
  FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Admins can manage oncall schedules" ON oncall_schedules
  FOR ALL USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- RLS POLICIES: POSTMORTEMS
CREATE POLICY "Org members can view postmortems" ON postmortems
  FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Admins and responders can manage postmortems" ON postmortems
  FOR ALL USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'responder'));

-- RLS POLICIES: ALERTS
CREATE POLICY "Org members can view alerts" ON alerts
  FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Admins can manage alerts" ON alerts
  FOR ALL USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- RLS POLICIES: INTEGRATIONS
CREATE POLICY "Org members can view integrations" ON integrations
  FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Admins can manage integrations" ON integrations
  FOR ALL USING (org_id = get_user_org_id() AND get_user_role() = 'admin');