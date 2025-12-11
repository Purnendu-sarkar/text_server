set -o errexit

npm install
npm run build
npx prisma generate
npx prisma db push
npx prisma migrate deploy
npm run render
npm run build:sw
npm run build:sw:render