-- Migration: User XP and Real Leveling System (v2 - Fixed FK Integrity)
-- Description: Adds user_xp table and triggers to automate XP gain on key actions

-- 1. Limpeza de segurança (caso a tentativa anterior tenha deixado a tabela em estado inconsistente)
DROP TABLE IF EXISTS public.user_xp CASCADE;

-- 2. Criação da tabela com referência explícita ao esquema auth
CREATE TABLE public.user_xp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

-- 4. Política de acesso
CREATE POLICY "Users can view own XP"
  ON public.user_xp FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Função de adicionar XP com verificação de existência
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id UUID, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas insere se o usuário realmente existir no AUTH
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    INSERT INTO public.user_xp (user_id, total_xp, current_level)
    VALUES (p_user_id, p_amount, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET total_xp = user_xp.total_xp + p_amount,
        updated_at = NOW();
  END IF;
END;
$$;

-- 6. Gatilho de XP para Hábitos
CREATE OR REPLACE FUNCTION public.on_habit_checkin_xp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    PERFORM public.add_user_xp(NEW.user_id, 10);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_habit_checkin_xp ON public.habit_checkins;
CREATE TRIGGER tr_habit_checkin_xp
AFTER INSERT OR UPDATE ON public.habit_checkins
FOR EACH ROW EXECUTE FUNCTION public.on_habit_checkin_xp();

-- 7. Gatilho de XP para Tarefas (Modular)
CREATE OR REPLACE FUNCTION public.on_task_completion_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- We assume tasks table has a 'completed' boolean or 'status' check
  -- If using task_subtasks for modular XP:
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    PERFORM public.add_user_xp(NEW.user_id, 5);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verifica se a tabela de sub-tarefas existe antes de aplicar o trigger
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_subtasks') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_task_subtask_xp') THEN
      CREATE TRIGGER tr_task_subtask_xp
      AFTER INSERT OR UPDATE ON public.task_subtasks
      FOR EACH ROW EXECUTE FUNCTION public.on_task_completion_xp();
    END IF;
  END IF;
END $$;

-- 8. INICIALIZAÇÃO SEGURA: Pega apenas IDs que existem em auth.users
INSERT INTO public.user_xp (user_id, total_xp)
SELECT id, 0 FROM auth.users;
