# 🍪 Migração para Autenticação com Cookies HttpOnly

## ✅ Implementado com Sucesso

Esta branch (`feat/cookie_http_only`) implementa autenticação segura usando cookies HttpOnly ao invés de localStorage.

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

### 1. **Login**
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

### **Opção 1: Fetch API (Recomendado)**
```typescript
const response = await fetch('http://localhost:3000/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ⚠️ IMPORTANTE: envia cookies
  body: JSON.stringify({ email, password }),
});
```

### **Opção 2: Axios**
```typescript
import axios from 'axios';

axios.defaults.withCredentials = true; // ⚠️ Habilita cookies globalmente

const response = await axios.post('http://localhost:3000/v1/auth/login', {
  email,
  password,
});
```

### **Remover localStorage**
```typescript
// ❌ ANTES (inseguro)
localStorage.setItem('token', data.token);

// ✅ DEPOIS (não precisa mais!)
// Token gerenciado automaticamente pelo browser via cookies
```

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

### Cookie não está sendo definido
- Verifique `credentials: true` no CORS
- Confirme que frontend usa `credentials: 'include'`
- Inspecione Network tab no DevTools

### Cookie não é enviado nas requisições
- Frontend deve usar `credentials: 'include'`
- Verifique se domínios estão corretos (localhost vs 127.0.0.1)
- Confirme que `sameSite` está correto para seu ambiente

### Erro de CORS
- `FRONTEND_URL` no `.env` deve corresponder à origem do frontend
- `credentials: true` é obrigatório
- Use domínio específico, não `*`

---

**✅ Implementação completa e pronta para uso!**
