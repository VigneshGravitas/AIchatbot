DO $$ BEGIN
    CREATE TYPE "visibility" AS ENUM ('private', 'public');
    CREATE TYPE "role" AS ENUM ('user', 'assistant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar(64) NOT NULL,
    "password" varchar(64)
);

CREATE TABLE IF NOT EXISTS "Chat" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL REFERENCES "User"("id"),
    "title" text NOT NULL,
    "createdAt" timestamp NOT NULL,
    "visibility" text NOT NULL DEFAULT 'private',
    "modelId" text NOT NULL DEFAULT 'hyperbolic-llama-70b'
);

CREATE TABLE IF NOT EXISTS "Message" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
    "role" varchar NOT NULL,
    "content" text NOT NULL,
    "createdAt" timestamp NOT NULL
);
