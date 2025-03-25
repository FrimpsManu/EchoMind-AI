/*
  # Add categories and folders support

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `color` (text)
      - `created_at` (timestamp)

  2. Changes
    - Add category_id to conversations table
    - Add indexes for better performance
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#2563eb',
  created_at timestamptz DEFAULT now()
);

-- Add category_id to conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS conversations_category_id_idx ON conversations(category_id);

-- Add some default categories
INSERT INTO categories (name, color) VALUES
  ('General', '#2563eb'),
  ('Work', '#16a34a'),
  ('Personal', '#db2777'),
  ('Study', '#9333ea')
ON CONFLICT DO NOTHING;