CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
