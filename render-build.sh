#!/usr/bin/env bash
set -o errexit

# Install dependencies
npm install --legacy-peer-deps

# Compile TypeScript
npm run build

# Prisma generate & push
npm run db:generate
npm run db:push
