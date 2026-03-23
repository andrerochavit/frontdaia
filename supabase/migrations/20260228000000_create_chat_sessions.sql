-- ============================================================
-- FIX: Adiciona coluna 'title' na tabela chat_sessions existente
-- e cria a tabela chat_messages
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1) Adiciona coluna title se ainda não existir
ALTER TABLE public.chat_sessions 
  ADD COLUMN IF NOT EXISTS title VARCHAR(120) NOT NULL DEFAULT 'Nova Conversa';

-- 2) Garante políticas na chat_sessions (recria sem conflito)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_sessions' AND policyname = 'Users can view their own chat sessions'
  ) THEN
    CREATE POLICY "Users can view their own chat sessions"
      ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_sessions' AND policyname = 'Users can insert their own chat sessions'
  ) THEN
    CREATE POLICY "Users can insert their own chat sessions"
      ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_sessions' AND policyname = 'Users can update their own chat sessions'
  ) THEN
    CREATE POLICY "Users can update their own chat sessions"
      ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_sessions' AND policyname = 'Users can delete their own chat sessions'
  ) THEN
    CREATE POLICY "Users can delete their own chat sessions"
      ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- 3) Cria tabela chat_messages se ainda não existir
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_session_idx
  ON public.chat_messages (session_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4) Políticas para chat_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_messages' AND policyname = 'Users can view their own messages'
  ) THEN
    CREATE POLICY "Users can view their own messages"
      ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_messages' AND policyname = 'Users can insert their own messages'
  ) THEN
    CREATE POLICY "Users can insert their own messages"
      ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_messages' AND policyname = 'Users can delete their own messages'
  ) THEN
    CREATE POLICY "Users can delete their own messages"
      ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
