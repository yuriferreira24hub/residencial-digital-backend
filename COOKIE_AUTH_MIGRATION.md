# 🍪 Migração para Autenticação com Cookies HttpOnly

## ✅ Implementado com Sucesso

Esta branch (`feat/http_cookie`) implementa autenticação segura usando cookies HttpOnly ao invés de localStorage.

---

## 🚀 Quick Start

### **Backend (já configurado)**
```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env
cp .env.example .env
# Editar FRONTEND_URL=http://localhost:3001

# 3. Rodar servidor
npm run dev
```

### **Frontend (requer configuração)**
```typescript
// ⚠️ OBRIGATÓRIO: Adicionar em todas as requisições
fetch('http://localhost:3000/v1/auth/login', {
  credentials: 'include', // 👈 SEM ISSO NÃO FUNCIONA!
  // ... resto da config
});
```

📖 **Ver exemplos completos:** [`FRONTEND_HTTP_CLIENT_EXAMPLE.md`](./FRONTEND_HTTP_CLIENT_EXAMPLE.md)

---

## 📦 Dependências Adicionadas

```bash
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

---

## 🔧 Mudanças Implementadas

### 1. **Configuração CORS (`src/app.ts`)**

```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true, // ⚠️ CRÍTICO: permite cookies cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(cookieParser());
```

### 2. **Login (`POST /v1/auth/login`)**

**Antes:**
```typescript
return res.json({ token: jwtToken, user });
```

**Depois:**
```typescript
res.cookie('auth_token', result.token, {
  httpOnly: true,        // Não acessível via JavaScript
  secure: isProduction,  // HTTPS apenas em produção
  sameSite: isProduction ? 'strict' : 'lax',
  maxAge: 3600000,       // 1 hora
  path: '/',
});

return res.json({
  message: 'Login realizado com sucesso',
  user: result.user,     // Token NÃO é retornado no body
});
```

### 3. **Middleware de Autenticação (`src/middlewares/auth.middleware.ts`)**

**Antes:**
```typescript
const token = req.headers.authorization?.split(' ')[1];
```

**Depois:**
```typescript
// Prioriza cookie, mas mantém compatibilidade com header
let token = req.cookies?.auth_token;

// Fallback para Authorization header (retrocompatibilidade)
if (!token) {
  const header = req.headers.authorization;
  if (header) [, token] = header.split(' ');
}
```

### 4. **Novos Endpoints**

#### **GET /v1/auth/check** - Verificar Autenticação
```typescript
// Retorna se o usuário está autenticado
{
  "authenticated": true,
  "user": { "id": 1, "role": "client" }
}
```

#### **POST /v1/auth/logout** - Logout
```typescript
// Limpa o cookie de autenticação
res.clearCookie('auth_token', { /* opções */ });

// Retorna
{
  "message": "Logout realizado com sucesso"
}
```

---

## 🌍 Variáveis de Ambiente

Adicione ao `.env`:

```env
# Frontend URL for CORS
FRONTEND_URL="http://localhost:3001"

# Node Environment
NODE_ENV="development"
```

### Configurações por Ambiente:

| Ambiente | `NODE_ENV` | `secure` | `sameSite` | HTTPS |
|----------|-----------|----------|------------|-------|
| **Dev**  | development | `false` | `lax` | Não |
| **Prod** | production | `true` | `strict` | ✅ Sim |

---

## 🔒 Benefícios de Segurança

✅ **Proteção XSS**: JavaScript malicioso não consegue acessar o token  
✅ **Proteção CSRF**: `sameSite: 'strict'` bloqueia requests cross-site  
✅ **Menor superfície de ataque**: Token não exposto no localStorage/sessionStorage  
✅ **Conformidade**: Alinha com OWASP e boas práticas modernas  

---

## 🧪 Como Testar

### **Script Automatizado (PowerShell) - Recomendado**

Execute o script de teste completo:

```powershell
.\scripts\test-cookie-auth.ps1
```

Este script testa automaticamente:
1. ✅ Login e definição de cookie
2. ✅ Verificação de autenticação (`/auth/check`)
3. ✅ Acesso a rota protegida
4. ✅ Logout e remoção de cookie
5. ✅ Verificação de não-autenticação

---

### **Testes Manuais com cURL**

#### 1. **Login**
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  -c cookies.txt
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "user": { "id": 1, "email": "admin@test.com", "role": "admin" }
}
```

**Cookie definido:** `auth_token=eyJhbGc...`

### 2. **Verificar Autenticação**
```bash
curl -X GET http://localhost:3000/v1/auth/check \
  -b cookies.txt
```

**Resposta:**
```json
{
  "authenticated": true,
  "user": { "id": 1, "role": "admin" }
}
```

### 3. **Acessar Rota Protegida**
```bash
curl -X GET http://localhost:3000/v1/quotes \
  -b cookies.txt
```

### 4. **Logout**
```bash
curl -X POST http://localhost:3000/v1/auth/logout \
  -b cookies.txt
```

**Resposta:**
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

## 🔄 Compatibilidade com Frontend

> 📖 **Veja exemplos completos de implementação em:** [`FRONTEND_HTTP_CLIENT_EXAMPLE.md`](./FRONTEND_HTTP_CLIENT_EXAMPLE.md)

### **Configuração Essencial**

Todas as requisições HTTP do frontend **DEVEM** incluir `credentials`:

#### **Fetch API:**
```typescript
fetch('http://localhost:3000/v1/auth/login', {
  credentials: 'include', // ⚠️ OBRIGATÓRIO
  // ... outras opções
});
```

#### **Axios:**
```typescript
axios.create({
  withCredentials: true, // ⚠️ OBRIGATÓRIO
  // ... outras opções
});
```

### **O que mudou no Frontend:**

| Antes (localStorage) | Depois (HttpOnly Cookie) |
|---------------------|-------------------------|
| `localStorage.setItem('token', data.token)` | ❌ Remover (cookie é automático) |
| `headers: { Authorization: 'Bearer ' + token }` | ❌ Remover (cookie é automático) |
| `localStorage.removeItem('token')` | `await logout()` (limpa cookie no backend) |
| ✅ Sem configuração especial | ⚠️ `credentials: 'include'` obrigatório |

### **Exemplos Prontos:**
- Cliente HTTP reutilizável (Fetch e Axios)
- AuthGuard para rotas protegidas
- Página de login completa
- Botão de logout

📖 **Ver todos os exemplos →](./FRONTEND_HTTP_CLIENT_EXAMPLE.md)**

📋 **Checklist de Migração →](./FRONTEND_MIGRATION_CHECKLIST.md)**

---

## 🚀 Deploy em Produção

### **Checklist:**

- [ ] Definir `NODE_ENV=production`
- [ ] Configurar HTTPS (certificado SSL/TLS)
- [ ] Atualizar `FRONTEND_URL` com domínio de produção
- [ ] Verificar `secure: true` e `sameSite: 'strict'`
- [ ] Configurar CORS com domínio específico (não usar `*`)

### **Exemplo de Produção:**
```env
NODE_ENV=production
FRONTEND_URL=https://app.meusite.com
```

### **Configurações de Cookie em Produção:**
```typescript
{
  httpOnly: true,
  secure: true,          // HTTPS obrigatório
  sameSite: 'strict',    // Máxima proteção CSRF
  domain: '.meusite.com', // Permite subdomínios
  maxAge: 3600000,
  path: '/',
}
```

---

## ⚠️ Notas Importantes

1. **Desenvolvimento Local**: `secure: false` permite testes em HTTP
2. **CORS**: `credentials: true` é obrigatório para cookies funcionarem
3. **Fallback**: Mantém compatibilidade com `Authorization: Bearer <token>` durante transição
4. **Expiração**: Cookie expira em 1 hora (igual ao JWT)
5. **Domínio**: Em produção, configure `domain` para permitir subdomínios

---

## 📚 Referências

- [OWASP - HttpOnly Cookie](https://owasp.org/www-community/HttpOnly)
- [MDN - SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Express Cookie Parser](https://github.com/expressjs/cookie-parser)

---

## 🐛 Troubleshooting

### ❌ Cookie não está sendo definido após login
**Sintomas:** Após login bem-sucedido, cookie não aparece no DevTools > Application > Cookies

**Soluções:**
1. Verificar `credentials: true` no CORS do backend
2. Confirmar que frontend usa `credentials: 'include'` ou `withCredentials: true`
3. Inspecionar DevTools > Network > Response Headers do `/auth/login`
4. Deve conter: `Set-Cookie: auth_token=...`

### ❌ Cookie não é enviado nas requisições (`401 Unauthorized`)
**Sintomas:** Endpoint `/auth/check` retorna 401, mas cookie existe no browser

**Soluções:**
1. **Frontend deve usar `credentials: 'include'` em TODAS as requisições**
2. Verificar se domínios estão corretos:
   - ✅ `http://localhost:3001` → `http://localhost:3000` (OK)
   - ❌ `http://127.0.0.1:3001` → `http://localhost:3000` (FALHA)
3. Confirmar que `sameSite` está correto (`lax` em dev, `strict` em prod)
4. Inspecionar DevTools > Network > Request Headers
5. Deve conter: `Cookie: auth_token=...`

### ❌ Erro de CORS
**Sintomas:** `Access-Control-Allow-Origin` ou `credentials` error no console

**Soluções:**
1. `FRONTEND_URL` no `.env` deve corresponder **EXATAMENTE** à origem do frontend
2. Backend deve ter `credentials: true` no CORS
3. Use domínio específico, **NUNCA** use `*` com `credentials: true`
4. Reiniciar servidor backend após alterar `.env`

### ❌ Cookie expira imediatamente
**Sintomas:** Precisa fazer login novamente após cada refresh

**Soluções:**
1. Verificar `maxAge` no `auth.controller.ts` (padrão: 1 hora)
2. Aumentar tempo se necessário:
```typescript
res.cookie('auth_token', token, {
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
  // ... outras opções
});
```

### 🔍 Ferramentas de Debug

**Chrome DevTools:**
1. **Network Tab:** Ver headers de request/response
2. **Application > Cookies:** Ver cookies armazenados
3. **Console:** Ver erros de CORS ou autenticação

**Teste rápido no terminal:**
```bash
# 1. Login e salvar cookie
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  -c cookies.txt -v

# 2. Verificar autenticação com cookie
curl -X GET http://localhost:3000/v1/auth/check \
  -b cookies.txt -v
```

📖 **Mais detalhes:** [`FRONTEND_HTTP_CLIENT_EXAMPLE.md`](./FRONTEND_HTTP_CLIENT_EXAMPLE.md)

---

**✅ Implementação completa e pronta para uso!**
