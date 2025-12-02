-- Fix RLS policies to add WITH CHECK clauses
-- Without WITH CHECK, INSERT operations are not restricted

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can manage own messages" ON public.ai_messages;

-- Recreate with WITH CHECK to secure INSERT/UPDATE operations
CREATE POLICY "Users can manage own conversations" ON public.ai_conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages" ON public.ai_messages
  FOR ALL
  USING (conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()))
  WITH CHECK (conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()));
