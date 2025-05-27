-- Create the site_movements table for tracking financial movements
CREATE TABLE IF NOT EXISTS site_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ingreso', 'egreso', 'ajuste')),
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  related_contact_id UUID,
  related_task_id INTEGER,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add Row Level Security (RLS)
ALTER TABLE site_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for site_movements
CREATE POLICY "Users can view movements from their organization projects" ON site_movements
FOR SELECT USING (
  project_id IN (
    SELECT id FROM projects 
    WHERE organization_id IN (
      SELECT organization_id FROM user_preferences 
      WHERE user_id = (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can insert movements for their organization projects" ON site_movements
FOR INSERT WITH CHECK (
  project_id IN (
    SELECT id FROM projects 
    WHERE organization_id IN (
      SELECT organization_id FROM user_preferences 
      WHERE user_id = (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can update movements for their organization projects" ON site_movements
FOR UPDATE USING (
  project_id IN (
    SELECT id FROM projects 
    WHERE organization_id IN (
      SELECT organization_id FROM user_preferences 
      WHERE user_id = (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can delete movements for their organization projects" ON site_movements
FOR DELETE USING (
  project_id IN (
    SELECT id FROM projects 
    WHERE organization_id IN (
      SELECT organization_id FROM user_preferences 
      WHERE user_id = (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    )
  )
);