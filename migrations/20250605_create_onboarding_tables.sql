-- Migration: Create onboarding tables
-- Date: 2025-06-05

-- Create organization_preferences table
CREATE TABLE IF NOT EXISTS organization_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    default_currency_id UUID REFERENCES currencies(id),
    default_wallet_id UUID REFERENCES wallets(id),
    pdf_template_id UUID REFERENCES pdf_templates(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Create user_profile_data table
CREATE TABLE IF NOT EXISTS user_profile_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    country TEXT,
    age INTEGER,
    discovered_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add onboarding_completed column to user_preferences if it doesn't exist
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create basic currencies if they don't exist
INSERT INTO currencies (id, code, name, symbol) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'USD', 'Dólar Estadounidense', '$'),
    ('550e8400-e29b-41d4-a716-446655440002', 'EUR', 'Euro', '€'),
    ('550e8400-e29b-41d4-a716-446655440003', 'ARS', 'Peso Argentino', '$'),
    ('550e8400-e29b-41d4-a716-446655440004', 'MXN', 'Peso Mexicano', '$'),
    ('550e8400-e29b-41d4-a716-446655440005', 'CLP', 'Peso Chileno', '$')
ON CONFLICT (code) DO NOTHING;

-- Create basic wallets if they don't exist
INSERT INTO wallets (id, name, description) VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', 'Efectivo', 'Dinero en efectivo'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Banco Principal', 'Cuenta bancaria principal'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Tarjeta de Crédito', 'Pagos con tarjeta'),
    ('660e8400-e29b-41d4-a716-446655440004', 'Caja Chica', 'Fondo para gastos menores')
ON CONFLICT (name) DO NOTHING;

-- Create basic PDF templates if they don't exist
INSERT INTO pdf_templates (id, name, description) VALUES 
    ('770e8400-e29b-41d4-a716-446655440001', 'Template Clásico', 'Diseño tradicional con encabezado'),
    ('770e8400-e29b-41d4-a716-446655440002', 'Template Moderno', 'Diseño minimalista contemporáneo'),
    ('770e8400-e29b-41d4-a716-446655440003', 'Template Corporativo', 'Formal para uso empresarial'),
    ('770e8400-e29b-41d4-a716-446655440004', 'Template Simple', 'Básico sin elementos decorativos')
ON CONFLICT (name) DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_preferences_org_id ON organization_preferences(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_data_user_id ON user_profile_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_onboarding ON user_preferences(onboarding_completed);