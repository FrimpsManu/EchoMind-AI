/*
  # Add message actions and reactions

  1. Changes
    - Add is_pinned column to messages table
    - Add reactions column to messages table for thumbs up/down
    - Update existing messages with default values

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{"thumbsUp": 0, "thumbsDown": 0}'::jsonb;