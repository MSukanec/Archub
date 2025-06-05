-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    symbol VARCHAR(10) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization_currencies table
CREATE TABLE IF NOT EXISTS organization_currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add onboarding_completed column to user_preferences if it doesn't exist
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Insert default currencies
INSERT INTO currencies (id, name, code, symbol) VALUES 
('58c50aa7-b8b1-4035-b509-58028dd0e33f', 'Peso Argentino', 'ARS', '$'),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Dólar Estadounidense', 'USD', '$'),
('b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'Euro', 'EUR', '€')
ON CONFLICT (id) DO NOTHING;

-- Insert default wallet if it doesn't exist
INSERT INTO wallets (id, name, description, wallet_type) VALUES 
('2658c575-0fa8-4cf6-85d7-6430ded7e188', 'Efectivo', 'Dinero en efectivo', 'cash')
ON CONFLICT (id) DO NOTHING;