-- Insertar tipos principales de movimientos (padres)
INSERT INTO movement_concepts (id, name, parent_id) VALUES
('ingreso-type', 'Ingresos', null),
('egreso-type', 'Egresos', null),
('ajuste-type', 'Ajustes', null)
ON CONFLICT (id) DO NOTHING;

-- Insertar categorías de ingresos (hijos)
INSERT INTO movement_concepts (id, name, parent_id) VALUES
('pago-cliente', 'Pago de Cliente', 'ingreso-type'),
('anticipo-cliente', 'Anticipo de Cliente', 'ingreso-type'),
('certificacion', 'Certificación', 'ingreso-type'),
('venta-material', 'Venta de Material', 'ingreso-type')
ON CONFLICT (id) DO NOTHING;

-- Insertar categorías de egresos (hijos)
INSERT INTO movement_concepts (id, name, parent_id) VALUES
('material-construccion', 'Materiales de Construcción', 'egreso-type'),
('mano-obra', 'Mano de Obra', 'egreso-type'),
('herramientas', 'Herramientas y Equipos', 'egreso-type'),
('transporte', 'Transporte', 'egreso-type'),
('servicios', 'Servicios Profesionales', 'egreso-type'),
('gastos-generales', 'Gastos Generales', 'egreso-type')
ON CONFLICT (id) DO NOTHING;

-- Insertar categorías de ajustes (hijos)
INSERT INTO movement_concepts (id, name, parent_id) VALUES
('correccion-error', 'Corrección de Error', 'ajuste-type'),
('ajuste-inventario', 'Ajuste de Inventario', 'ajuste-type'),
('diferencia-cambio', 'Diferencia de Cambio', 'ajuste-type')
ON CONFLICT (id) DO NOTHING;