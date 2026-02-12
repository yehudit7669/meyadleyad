FROM node:20-bullseye-slim

WORKDIR /app

# Prisma צריך openssl/ca-certificates בסביבה לינוקסית “יציבה”
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# בזמן build: מריצים prisma generate בלי DB אמיתי (רק כדי לייצר Client)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate \
  && npx tsc

EXPOSE 3000

# בזמן ריצה: כאן כבר יש DB אמיתי דרך docker-compose, ואז עושים migrate
CMD sh -c "npx prisma migrate deploy && node dist/server.js"
