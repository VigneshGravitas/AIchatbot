-- Add modelId column to Chat table with proper quotes
ALTER TABLE "Chat" ADD COLUMN "modelId" text NOT NULL DEFAULT 'hyperbolic-llama-70b';
