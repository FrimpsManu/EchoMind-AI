/*
  # Add RLS policies for conversations table

  1. Security
    - Enable RLS on conversations table if not already enabled
    - Add policies for:
      - Users can create their own conversations
      - Users can view their own conversations
      - Users can delete their own conversations
    - Set default value for user_id
*/

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'conversations' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversations' 
    AND policyname = 'Users can create their own conversations'
  ) THEN
    CREATE POLICY "Users can create their own conversations"
    ON conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversations' 
    AND policyname = 'Users can view their own conversations'
  ) THEN
    CREATE POLICY "Users can view their own conversations"
    ON conversations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversations' 
    AND policyname = 'Users can delete their own conversations'
  ) THEN
    CREATE POLICY "Users can delete their own conversations"
    ON conversations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Set default value for user_id if not already set
DO $$
BEGIN
  ALTER TABLE conversations
  ALTER COLUMN user_id SET DEFAULT auth.uid();
EXCEPTION
  WHEN others THEN
    NULL; -- Ignore if the default is already set
END $$;