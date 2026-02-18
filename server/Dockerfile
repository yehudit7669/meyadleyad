FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libglib2.0-0 \
  libnss3 \
  libnspr4 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  libxshmfence1 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

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
