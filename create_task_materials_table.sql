-- Crear tabla task_materials para vincular tareas con materiales
CREATE TABLE IF NOT EXISTS task_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(task_id, material_id)
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_task_materials_task_id ON task_materials(task_id);
CREATE INDEX IF NOT EXISTS idx_task_materials_material_id ON task_materials(material_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_task_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_materials_updated_at
    BEFORE UPDATE ON task_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_task_materials_updated_at();