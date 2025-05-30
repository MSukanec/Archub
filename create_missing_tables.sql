-- Crear tabla de unidades
CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de acciones
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de elementos de tarea
CREATE TABLE IF NOT EXISTS task_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar unidades básicas
INSERT INTO units (name, symbol) VALUES
('Metro', 'm'),
('Metro cuadrado', 'm²'),
('Metro cúbico', 'm³'),
('Kilogramo', 'kg'),
('Tonelada', 't'),
('Unidad', 'ud'),
('Litro', 'l'),
('Hora', 'h'),
('Día', 'd')
ON CONFLICT DO NOTHING;

-- Insertar acciones básicas
INSERT INTO actions (name) VALUES
('Construcción'),
('Instalación'),
('Demolición'),
('Reparación'),
('Mantenimiento'),
('Pintura'),
('Limpieza'),
('Excavación')
ON CONFLICT DO NOTHING;

-- Insertar elementos básicos
INSERT INTO task_elements (name) VALUES
('Muro'),
('Puerta'),
('Ventana'),
('Piso'),
('Techo'),
('Tubería'),
('Cable'),
('Estructura')
ON CONFLICT DO NOTHING;