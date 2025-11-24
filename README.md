📌 README.md — Mini Residencial Digital

🏠 Sistema de Seguros Residencial — API Backend

Este projeto é uma API REST moderna para gerenciamento de seguros residenciais, construída com:

Node.js + Express

TypeScript

Prisma ORM

PostgreSQL (via Docker)

JWT Authentication

Zod Validation

Arquitetura limpa (controllers, services, repositories)

A API permite:

✔ Cadastro e autenticação de usuários
✔ Cadastro de imóveis
✔ Criação de cotações
✔ Aprovação/Rejeição pelo administrador
✔ Emissão automática de apólices
✔ Listagem de apólices, cotações e propriedades
✔ Controle de acesso via roles (admin / client)

🚀 1. Como rodar o projeto
1️⃣ Instale as dependências:
npm install

2️⃣ Inicie o Postgres com Docker:
docker run --name residencial-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=segurodb -p 5432:5432 -d postgres:15

3️⃣ Crie as tabelas com Prisma:
npx prisma migrate dev --name init

4️⃣ Inicie o servidor:
npm run dev


Se tudo estiver OK:

Servidor rodando na porta: 3000

🔐 2. Criando o usuário ADMIN

Crie um script em:

📁 scripts/create-admin.ts

Depois execute:

npx ts-node scripts/create-admin.ts


O admin será criado com:

email: admin@test.com

senha: admin123

Use esse login para acessar rotas administrativas.

👤 3. Autenticação (Login)
📌 POST /v1/auth/login
Body:
{
  "email": "admin@test.com",
  "password": "admin123"
}

Resposta:
{
  "token": "JWT_TOKEN",
  "user": {
    "id": 9,
    "role": "admin"
  }
}


Use esse token no Postman → Headers:

Authorization: Bearer SEU_TOKEN

👥 4. CRUD de Usuários
➤ Criar usuário

POST /v1/users

{
  "name": "Yuri",
  "email": "yuri@test.com",
  "password": "123456"
}

➤ Listar usuários (apenas admin)

GET /v1/users

➤ Buscar usuário por ID

GET /v1/users/:id

➤ Atualizar usuário

PUT /v1/users/:id

➤ Excluir usuário

DELETE /v1/users/:id

🏠 5. Propriedades (Imóveis)
➤ Criar imóvel

POST /v1/properties

{
  "type": "Casa",
  "address": "Rua 1",
  "number": "120",
  "district": "Centro",
  "city": "São José",
  "state": "SC",
  "zipCode": "88103760",
  "riskCategory": "baixo",
  "area": 120
}

➤ Listar imóveis do usuário

GET /v1/properties

➤ Buscar imóvel por ID

GET /v1/properties/:id

📄 6. Cotações
6.1 Criar cotação

POST /v1/quotes

{
  "clientName": "João da Silva",
  "cpfCnpj": "12345678901",
  "initialDateInsurance": "20250101",
  "propertyId": 1,
  "listCoverage": [
    { "code": "INCENDIO", "sumInsured": 50000 },
    { "code": "ROUBO", "sumInsured": 10000 }
  ]
}


A API automaticamente:

✔ Busca o imóvel
✔ Gera o endereço de risco
✔ Cria a cotação com status "pending"

6.2 Listar cotações do usuário

GET /v1/quotes

6.3 Listar cotações pendentes (ADMIN)

GET /v1/quotes/pending

6.4 Buscar cotação

GET /v1/quotes/:id

📝 7. Aprovar Cotação (ADMIN)
POST /v1/quotes/:id/approve

Não precisa enviar body.

Resposta:

{
  "message": "Cotação aprovada e apólice emitida.",
  "policy": {
    "policyNumber": "POL17631476...",
    "status": "active"
  }
}

❌ 8. Rejeitar cotação (ADMIN)
POST /v1/quotes/:id/reject

Body:

{
  "reason": "Dados incompletos"
}

📜 9. Apólices
➤ Listar apólices do usuário

GET /v1/policies

➤ Buscar apólice

GET /v1/policies/:id

🛠 10. Estrutura do projeto
src/
 ├── controllers/
 ├── services/
 ├── routes/
 ├── repositories/
 ├── dtos/
 ├── middlewares/
 ├── utils/
 └── app.ts

🧪 11. Testes com Postman

Sempre enviar o JWT no header:

Authorization: Bearer SEU_TOKEN


Apenas ADMIN pode:

/v1/quotes/pending

/v1/quotes/:id/approve

/v1/quotes/:id/reject

🎯 Final

Seu backend está pronto para produção, com:

✔ Autenticação JWT
✔ Controle de acesso por roles
✔ Fluxo completo de cotação → apólice
✔ CRUD de usuário
✔ CRUD de imóvel
✔ Gestão de cotações e apólices
✔ Repositórios e services organizados
✔ Prisma ORM + PostgreSQL via Docker