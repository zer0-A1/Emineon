#!/bin/bash

# Run E2E tests with Neon database
DATABASE_URL="postgresql://neondb_owner:npg_kDYdf2A7rmNz@ep-jolly-shadow-agc4ewcs-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require" \
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_placeholder" \
CLERK_SECRET_KEY="sk_test_placeholder" \
npm run test:e2e
