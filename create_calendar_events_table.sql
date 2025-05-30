-- Create calendar_events table for the agenda/calendar functionality

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TEXT NOT NULL, -- Store as YYYY-MM-DD
  time TEXT NOT NULL, -- Store as HH:MM
  duration VARCHAR(50) NOT NULL, -- Duration in minutes as string
  location VARCHAR(255),
  attendees TEXT, -- Comma-separated list of attendees
  type TEXT CHECK (type IN ('meeting', 'task', 'reminder', 'appointment')) NOT NULL DEFAULT 'meeting',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) NOT NULL DEFAULT 'medium',
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at_local TIMESTAMP WITH TIME ZONE, -- Local browser timestamp
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_organization_id ON calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_priority ON calendar_events(priority);

-- Add RLS (Row Level Security) policy
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access events from their organization
CREATE POLICY calendar_events_organization_policy ON calendar_events
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Insert some sample events for testing (optional)
/*
INSERT INTO calendar_events (title, description, date, time, duration, location, type, priority, organization_id)
VALUES 
  ('Reunión de equipo', 'Revisión semanal del progreso del proyecto', '2025-05-30', '09:00', '60', 'Sala de reuniones', 'meeting', 'medium', 'your-organization-id-here'),
  ('Inspección de obra', 'Verificación del avance de construcción', '2025-06-01', '14:00', '120', 'Obra Williams 123', 'appointment', 'high', 'your-organization-id-here'),
  ('Entrega de materiales', 'Recepción de ladrillos y cemento', '2025-06-02', '08:00', '90', 'Depósito', 'task', 'medium', 'your-organization-id-here');
*/