-- Migration: Add Savings Goals Table
-- Description: Create table to store user financial savings goals (e.g., emergency fund, vacation, financial freedom)

CREATE TABLE IF NOT EXISTS finance_savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount >= 0),
    current_amount DECIMAL(12,2) DEFAULT 0 CHECK (current_amount >= 0),
    icon TEXT DEFAULT '🎯',
    color TEXT DEFAULT '#8B5CF6',
    deadline DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_savings_goals_org_user ON finance_savings_goals(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_active ON finance_savings_goals(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE finance_savings_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own savings goals"
    ON finance_savings_goals FOR SELECT
    USING (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can create their own savings goals"
    ON finance_savings_goals FOR INSERT
    WITH CHECK (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own savings goals"
    ON finance_savings_goals FOR UPDATE
    USING (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can delete their own savings goals"
    ON finance_savings_goals FOR DELETE
    USING (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
        AND user_id = auth.uid()
    );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_savings_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER savings_goals_updated_at
    BEFORE UPDATE ON finance_savings_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_savings_goals_updated_at();
