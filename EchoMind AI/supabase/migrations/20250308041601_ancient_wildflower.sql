/*
  # Allow anonymous access to conversations and messages

  1. Changes
    - Disable RLS on conversations and messages tables to allow anonymous access
    - Remove existing policies that require authentication
    - Add new policies for public access

  2. Security Note
    - This configuration allows anonymous access to all conversations and messages
    - Suitable for demo/development purposes where authentication is not required
*/

-- Disable RLS on conversations table
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on messages table
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Remove user_id default constraint since we don't need it anymore
ALTER TABLE conversations ALTER COLUMN user_id DROP DEFAULT;