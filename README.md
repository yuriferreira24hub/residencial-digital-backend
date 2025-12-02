# Mini Residencial Digital — API Backend

Sistema de Seguros Residencial — API REST moderna, em Node.js/TypeScript, com autenticação JWT, Prisma ORM e PostgreSQL (via Docker). Arquitetura limpa com camadas de rotas, controllers, services e repositories.

📚 Sumário
- Visão Geral
- Stack Técnica
- Arquitetura & Fluxo de Requisição
- Estrutura de Pastas
- Ambiente & Configuração (.env)
- Instalação & Execução
- Scripts Disponíveis
- Banco de Dados & Prisma
- Autenticação & Autorização
- Fluxo de Cotações (Pública vs Autenticada)
- Endpoints Principais (Resumo)
- Exemplos de Requisição
- Validação & Erros
- Domínios (Integração / Mock)
- Boas Práticas e Segurança
- Roadmap / Próximas Melhorias
- Contribuição
- Licença

## 1. Visão Geral
- Cadastro e autenticação de usuários (JWT)
- Registro de imóveis (properties)
- Criação de cotações (públicas e autenticadas)
- Aprovação/Rejeição de cotações (admin)
- Emissão de apólices automática após aprovação
- Consulta de domínios (mock de integração externa)
- Estrutura extensível para sinistros, pagamentos e documentos

## 2. Stack Técnica
- Runtime: Node.js 20+
- Framework: Express
- Linguagem: TypeScript
- ORM / Banco: Prisma + PostgreSQL
- Autenticação: JWT
- Validação: Zod
- Logs: Console (evolutivo)
- Container DB: Docker (Postgres 15)

## 3. Arquitetura & Fluxo de Requisição
- Cliente → `routes/*`
- Controller: valida e orquestra
- Service: regras de negócio
- Repository: acesso ao banco (Prisma)
- Resposta → `error.middleware` trata erros
- Middlewares: `cors`, `express.json`, `authMiddleware`, `errorMiddleware`

## 4. Estrutura de Pastas
```
src/
 ├─ app.ts                 # Configuração Express
 ├─ server.ts              # Inicialização + dotenv
 ├─ routes/                # Endpoints HTTP
 ├─ controllers/           # Camada HTTP
 ├─ services/              # Regras de negócio
 ├─ repositories/          # Prisma abstractions
 ├─ dtos/                  # Schemas de validação (Zod)
 ├─ middlewares/           # Auth, error, validate
 ├─ utils/                 # jwt, prisma, logger
 └─ @types/express         # Extensão de Request (req.user)
prisma/
 ├─ schema.prisma          # Modelo de dados
 └─ migrations/            # Histórico de migrações
scripts/
 └─ create-admin.ts        # Seed de administrador
openapi.yaml                # Documentação manual (referência)
```

## 5. Ambiente & Configuração (.env)
Crie `.env` na raiz:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/segurodb?schema=public"
JWT_SECRET="super-secret"
PORT=3000
```

## 6. Instalação & Execução (PowerShell)
```powershell
# Instalar dependências
npm install

# Subir Postgres
docker run --name residencial-db `
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=segurodb `
  -p 5432:5432 -d postgres:15

# Rodar migrações
npx prisma migrate dev --name init

# Gerar cliente Prisma
npx prisma generate

# Criar usuário admin (seed)
npx ts-node scripts/create-admin.ts

# Iniciar em desenvolvimento
npm run dev
```
Base URL: `http://localhost:3000/v1`

## 7. Scripts Disponíveis
- `npm run dev`: Desenvolvimento com reload
- `npm run build`: Compila TS → dist
- `npm start`: Roda versão compilada
- `npm run prisma:generate`: Gera cliente Prisma
- `npm run prisma:migrate`: Migração de desenvolvimento

## 8. Banco de Dados & Prisma
- Entidades: `User`, `Property`, `Quote`, `Policy` (evolução: `Claim`, `Payment`, `Document`)
- Relacionamentos:
  - User 1—N Property
  - User 1—N Quote
  - Quote 1—N Policy

## 9. Autenticação & Autorização

### 🍪 Autenticação via Cookies HttpOnly (Recomendado)
Esta API usa **cookies HttpOnly** para autenticação, aumentando a segurança contra ataques XSS.

**Endpoints:**
- `POST /v1/auth/login` - Login e define cookie
- `GET /v1/auth/check` - Verifica se usuário está autenticado
- `POST /v1/auth/logout` - Remove cookie de autenticação

**Como funciona:**
1. Após login bem-sucedido, o backend define automaticamente um cookie `auth_token`
2. O navegador envia esse cookie em todas as requisições subsequentes
3. O `authMiddleware` valida o token do cookie e popula `req.user = { id, role }`

**Exemplo de Login:**
```http
POST /v1/auth/login
Content-Type: application/json

{ "email": "admin@test.com", "password": "admin123" }
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "user": { "id": 1, "email": "admin@test.com", "role": "admin" }
}
```

> 🔒 **Nota:** O token JWT é enviado via cookie `Set-Cookie` no header da resposta, não no body.

**Frontend:** Todas as requisições devem incluir `credentials: 'include'` (Fetch) ou `withCredentials: true` (Axios).

📖 **Documentação completa:**
- [`COOKIE_AUTH_MIGRATION.md`](./COOKIE_AUTH_MIGRATION.md) - Detalhes da implementação
- [`FRONTEND_HTTP_CLIENT_EXAMPLE.md`](./FRONTEND_HTTP_CLIENT_EXAMPLE.md) - Exemplos de código

### 🔄 Compatibilidade com Authorization Header
Por retrocompatibilidade, a API ainda aceita `Authorization: Bearer <token>`, mas o uso de cookies é recomendado.

## 10. Fluxo de Cotações (Pública vs Autenticada)
- Pública: `POST /v1/quotes/public`
```http
POST /v1/quotes/public
Content-Type: application/json

{ "clientName": "Fulano", "cpfCnpj": "12345678901", "initialDateInsurance": "20250101", "listCoverage": [ { "code": "INCENDIO", "sumInsured": 50000 } ] }
```
- Autenticada: `POST /v1/quotes`
```http
POST /v1/quotes
Authorization: Bearer <token>
Content-Type: application/json

{ "clientName": "Maria Silva", "cpfCnpj": "98765432100", "initialDateInsurance": "20250101", "propertyId": 8, "listCoverage": [ { "code": "INCENDIO", "sumInsured": 50000 }, { "code": "ROUBO", "sumInsured": 10000 } ] }
```
- Comportamento: valida propriedade do usuário, monta `riskDataAddress`, status `pending`
- Admin: `POST /v1/quotes/:id/approve`, `POST /v1/quotes/:id/reject`

Exemplo (rejeitar – admin):
```http
POST /v1/quotes/9/reject
Authorization: Bearer <token_admin>
Content-Type: application/json

{ "reason": "Coberturas incompatíveis com perfil do imóvel" }
```
Resposta esperada:
```json
{ "message": "Cotação rejeitada com sucesso." }
```

## 11. Endpoints Principais (Resumo)
- `POST   /v1/auth/login`         —     Pública    —        Login (define cookie)
- `GET    /v1/auth/check`         —     JWT        —        Verifica autenticação
- `POST   /v1/auth/logout`        —     JWT        —        Logout (limpa cookie)
- `POST   /v1/users`              —     Pública    —        Cria usuário
- `GET    /v1/users`              —     Admin      —        Lista usuários
- `POST   /v1/properties`         —     JWT        —        Cria imóvel
- `GET    /v1/properties`         —     JWT        —        Lista imóveis do usuário
- `POST   /v1/quotes/public`      —     Pública    —        Cotação desvinculada
- `POST   /v1/quotes`             —     JWT        —        Cotação vinculada a imóvel
- `GET    /v1/quotes`             —     JWT        —        Lista cotações do usuário
- `GET    /v1/quotes/pending`     —     Admin      —        Lista pendentes
- `POST   /v1/quotes/:id/approve` —     Admin      —        Aprova e gera apólice
- `POST   /v1/quotes/:id/reject`  —     Admin      —        Rejeita cotação
- `GET    /v1/domains/:code`      —     JWT        —        Domínios mock (Allianz)
- `GET    /v1/policies`           —     JWT        —        Lista apólices do usuário
- `GET    /v1/policies/:id`       —     JWT        —        Detalhe apólice

## 12. Exemplos de Requisição
- Criar imóvel:
```http
POST /v1/properties
Authorization: Bearer <token>
Content-Type: application/json

{ "type": "Casa", "address": "Rua Exemplo", "city": "São José", "state": "SC", "zipCode": "88103760", "riskCategory": "baixo", "constructionYear": 2015, "area": 90, "estimatedValue": 300000 }
```
- Aprovar cotação:
```http
POST /v1/quotes/9/approve
Authorization: Bearer <token_admin>
```

## 13. Validação & Erros
- Zod nos DTOs: mensagens claras e campos obrigatórios
- Padrões:
  - 400: entrada inválida / regra de negócio
  - 401: não autenticado
  - 403: sem permissão
  - 404: não encontrado
  - 422: validação
  - 500: erro inesperado

## 14. Domínios (Integração / Mock)
- `GET /v1/domains/9999` → lista de coberturas
- Baseado em `AllianzService` (mock)

## 15. Boas Práticas e Segurança
- Adicionar `helmet` e rate limiting em produção
- Aumentar custo do `bcrypt` (ex.: 12)
- Não expor `JWT_SECRET`
- Middleware dedicado `requireAdmin`
- Sanitização de entradas

## 16. Roadmap / Próximas Melhorias
- Middleware `requireAdmin`
- Paginação (`skip`/`take`)
- Enums de status no Prisma
- Testes (Jest + supertest)
- Logs estruturados (Pino/Winston)
- Refresh token & revogação
- Cache (Redis) para domínios
- OpenTelemetry
- Integração externa real

## 17. Contribuição
- Fork / clone
- Branch: `feat/minha-feature`
- (Futuro) testes / linter
- Pull Request com descrição clara

## 18. Licença
MIT (ajustável conforme necessidade)

## OpenAPI & Swagger UI
- `openapi.yaml` descreve os endpoints
- Swagger UI: `http://localhost:3000/docs`
- Auxiliares: `GET /openapi.json`, `GET /openapi.yaml`

## Troubleshooting
- Locks do Prisma em Windows/OneDrive:
  - Pare processos Node; rode `npx prisma generate`
- `GET /v1/quotes/pending` 404:
  - Garanta `/pending` antes de `/:id` em `quotes.routes.ts`
- Campos de `Property`:
  - Use `riskCategory`, `area`, `estimatedValue` (e `constructionYear?`)