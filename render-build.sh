#!/usr/bin/env bash
set -o errexit

npm install
npm run build      # <-- dist/ generate
npm run db:generate
npm run db:push
