FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npx prisma generate || echo 'Prisma generate skipped'
EXPOSE 3000
CMD ["npm", "run", "dev"]
