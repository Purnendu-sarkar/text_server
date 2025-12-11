#!/usr/bin/env bash
set -o errexit

# Install dependencies
npm install --legacy-peer-deps

# Compile TypeScript
npm run build

# Prisma generate & push (local binary ব্যবহার)
npx prisma generate --schema=prisma/schema
npx prisma db push --schema=prisma/schema


