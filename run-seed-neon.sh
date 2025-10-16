#!/bin/bash

# Run the seed script with the Neon database URL
DATABASE_URL="postgresql://neondb_owner:npg_kDYdf2A7rmNz@ep-jolly-shadow-agc4ewcs-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require" npx tsx scripts/seed-test-data-with-embeddings.ts
