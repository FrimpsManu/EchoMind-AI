/*
  # Add hasReacted field to reactions

  1. Changes
    - Add hasReacted boolean field to reactions JSONB column
    - Set default value for reactions to include hasReacted
    - Update existing rows to include hasReacted field
*/

-- Update the default value for the reactions column
ALTER TABLE messages 
ALTER COLUMN reactions SET DEFAULT '{"thumbsUp": 0, "thumbsDown": 0, "hasReacted": false}'::jsonb;

-- Update existing rows to include hasReacted field if it doesn't exist
UPDATE messages
SET reactions = reactions || '{"hasReacted": false}'::jsonb
WHERE NOT (reactions ? 'hasReacted');