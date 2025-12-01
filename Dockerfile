FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# expõe porta do backend
EXPOSE 3000

# rodar migrations e iniciar dev
CMD npx prisma migrate dev --name init && npm i --save-dev @types/node && npm run dev