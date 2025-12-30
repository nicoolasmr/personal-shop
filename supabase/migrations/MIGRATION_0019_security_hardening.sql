-- Migration: Security Hardening
-- Description: Adds user_roles RLS and improves handle_new_user validation

-- 1. user_roles RLS Policy
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Improve handle_new_user with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_org_id uuid;
  v_full_name text;
BEGIN
  -- Validate and sanitize full_name
  v_full_name := trim(coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'));
  IF v_full_name = '' THEN v_full_name := 'Usuário'; END IF;
  v_full_name := left(v_full_name, 255);

  -- 1. Criar organização pessoal
  INSERT INTO public.orgs (name)
  VALUES (v_full_name || '''s Space')
  RETURNING id INTO v_org_id;

  -- 2. Criar profile vinculado à org
  INSERT INTO public.profiles (user_id, org_id, full_name, email)
  VALUES (new.id, v_org_id, v_full_name, new.email);

  -- 3. Definir como owner da org
  INSERT INTO public.memberships (user_id, org_id, role)
  VALUES (new.id, v_org_id, 'owner');

  -- 4. Atribuir role base
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
