# 🧪 Guia Rápido de Testes - Autenticação com Cookies

## 📋 Pré-requisitos

1. Backend rodando: `npm run dev`
2. Ferramenta de teste: Postman, Insomnia, ou curl

---

## 🔐 Cenário 1: Login Completo

### 1.1 Login com Sucesso

**Request:**
```http
POST http://localhost:3000/v1/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "admin123"
}
```

**Response esperada:**
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@test.com",
    "role": "admin"
  }
}
```

**Cookie definido nos headers:**
```
Set-Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Path=/; HttpOnly; SameSite=Lax
```

### 1.2 Verificar Autenticação

**Request:**
```http
GET http://localhost:3000/v1/auth/check
```

**Response esperada:**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "role": "admin"
  }
}
```

### 1.3 Acessar Rota Protegida (Listar Cotações)

**Request:**
```http
GET http://localhost:3000/v1/quotes
```

**Response:** Lista de cotações do usuário autenticado

### 1.4 Logout

**Request:**
```http
POST http://localhost:3000/v1/auth/logout
```

**Response:**
```json
{
  "message": "Logout realizado com sucesso"
}
```

**Cookie removido:** `Set-Cookie: auth_token=; Path=/; Expires=Thu, 01 Jan 1970...`

---

## ❌ Cenário 2: Testes de Falha

### 2.1 Acesso sem Autenticação

**Request:**
```http
GET http://localhost:3000/v1/quotes
```

**Response esperada (401):**
```json
{
  "message": "Token não informado"
}
```

### 2.2 Login com Credenciais Inválidas

**Request:**
```http
POST http://localhost:3000/v1/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "senha_errada"
}
```

**Response esperada:**
```json
{
  "token": "",
  "user": { ... },
  "msg": "Senha incorreta!"
}
```

### 2.3 Verificar Autenticação sem Cookie

**Request:**
```http
GET http://localhost:3000/v1/auth/check
```

**Response esperada (401):**
```json
{
  "message": "Token não informado"
}
```

---

## 🧪 Cenário 3: Compatibilidade com Header Authorization

> O backend mantém retrocompatibilidade com tokens no header

**Request:**
```http
GET http://localhost:3000/v1/quotes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** ✅ Funciona normalmente

---

## 📱 Cenário 4: Teste com Frontend

### 4.1 Login (Fetch API)

```typescript
const response = await fetch('http://localhost:3000/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ⚠️ IMPORTANTE
  body: JSON.stringify({
    email: 'admin@test.com',
    password: 'admin123',
  }),
});

const data = await response.json();
console.log('Usuário logado:', data.user);
// Cookie é automaticamente armazenado pelo browser
```

### 4.2 Requisição Autenticada

```typescript
const response = await fetch('http://localhost:3000/v1/quotes', {
  credentials: 'include', // ⚠️ Envia o cookie automaticamente
});

const quotes = await response.json();
console.log('Cotações:', quotes);
```

### 4.3 Logout

```typescript
await fetch('http://localhost:3000/v1/auth/logout', {
  method: 'POST',
  credentials: 'include',
});

// Cookie é automaticamente removido pelo browser
```

---

## 🔧 Ferramentas de Teste

### **Postman**
1. Envie request de login
2. Cookie é automaticamente salvo
3. Próximas requests usam o cookie automaticamente

### **Insomnia**
1. Envie request de login
2. Vá em "Cookies" → Verifique `auth_token`
3. Cookie é enviado automaticamente nas próximas requests

### **Browser DevTools**
1. Abra Console → Network
2. Faça login
3. Inspecione headers: `Set-Cookie: auth_token=...`
4. Application → Cookies → `http://localhost:3000`
5. Veja o cookie `auth_token` com flag `HttpOnly`

### **curl (Terminal)**

**Login e salvar cookie:**
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  -c cookies.txt -v
```

**Usar cookie em outra request:**
```bash
curl -X GET http://localhost:3000/v1/auth/check \
  -b cookies.txt
```

**Logout:**
```bash
curl -X POST http://localhost:3000/v1/auth/logout \
  -b cookies.txt
```

---

## ✅ Checklist de Validação

- [ ] Login retorna `message` e `user` (sem `token` no body)
- [ ] Cookie `auth_token` é definido no response header
- [ ] Cookie tem flags: `HttpOnly`, `Path=/`, `SameSite=Lax`
- [ ] `/auth/check` retorna `authenticated: true` com cookie válido
- [ ] Rotas protegidas funcionam com cookie
- [ ] Logout remove o cookie
- [ ] Após logout, `/auth/check` retorna 401
- [ ] Fallback com `Authorization: Bearer` ainda funciona

---

## 🐛 Debugging

### Ver logs do middleware:
```
PATH: /v1/quotes
CLEAN PATH: /quotes
Public: false
```

### Verificar se cookie está sendo enviado:
- Postman: Console → View cookies
- Browser DevTools: Network → Headers → Cookie
- Insomnia: Timeline → Request → Cookie

### Cookie não funciona?
1. Verifique `credentials: 'include'` no frontend
2. Confirme CORS com `credentials: true`
3. Verifique `FRONTEND_URL` no `.env`
4. Use `localhost` (não `127.0.0.1`) em ambos
5. Em dev, `secure: false` (HTTP ok)

---

## 📊 Comparação: Antes vs Depois

| Item | Antes (localStorage) | Depois (Cookie HttpOnly) |
|------|----------------------|--------------------------|
| **Token no Response** | ✅ `{ token: "..." }` | ❌ Não retorna |
| **Armazenamento** | localStorage | Cookie HttpOnly |
| **JS Access** | ✅ Sim | ❌ Não (XSS safe) |
| **Auto-envio** | ❌ Manual | ✅ Automático |
| **CSRF Protection** | ❌ Nenhuma | ✅ SameSite |
| **Segurança** | ⚠️ Baixa | ✅ Alta |

---

**✅ Testes completos! Sistema pronto para produção.**
