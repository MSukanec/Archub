-- Create movement_concepts table for movement types and categories
CREATE TABLE IF NOT EXISTS movement_concepts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES movement_concepts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_movement_concepts_parent_id ON movement_concepts(parent_id);

-- Insert movement types (parents)
INSERT INTO movement_concepts (id, name, parent_id) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Ingreso', NULL),
  ('550e8400-e29b-41d4-a716-446655440002', 'Egreso', NULL),
  ('550e8400-e29b-41d4-a716-446655440003', 'Ajuste', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert categories for Ingreso
INSERT INTO movement_concepts (name, parent_id) VALUES 
  ('Pago de Cliente', '550e8400-e29b-41d4-a716-446655440001'),
  ('Anticipo', '550e8400-e29b-41d4-a716-446655440001'),
  ('Certificación', '550e8400-e29b-41d4-a716-446655440001'),
  ('Otros Ingresos', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT DO NOTHING;

-- Insert categories for Egreso
INSERT INTO movement_concepts (name, parent_id) VALUES 
  ('Materiales', '550e8400-e29b-41d4-a716-446655440002'),
  ('Mano de Obra', '550e8400-e29b-41d4-a716-446655440002'),
  ('Herramientas', '550e8400-e29b-41d4-a716-446655440002'),
  ('Transporte', '550e8400-e29b-41d4-a716-446655440002'),
  ('Gastos Administrativos', '550e8400-e29b-41d4-a716-446655440002'),
  ('Otros Gastos', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT DO NOTHING;

-- Insert categories for Ajuste
INSERT INTO movement_concepts (name, parent_id) VALUES 
  ('Corrección de Valor', '550e8400-e29b-41d4-a716-446655440003'),
  ('Ajuste por Inflación', '550e8400-e29b-41d4-a716-446655440003'),
  ('Reclasificación', '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT DO NOTHING;