// Prisma 7 config — connection string is read from DATABASE_URL env var at runtime.
// The adapter for queries is configured in src/lib/prisma.ts.
// This file just declares the schema location for the CLI.
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
