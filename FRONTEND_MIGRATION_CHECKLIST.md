# ✅ Checklist de Migração - Frontend para Cookies HttpOnly

Use este checklist para garantir uma migração completa e sem erros do localStorage para cookies HttpOnly.

---

## 📋 Pré-Requisitos

- [ ] Backend rodando em `http://localhost:3000`
- [ ] Frontend rodando em `http://localhost:3001` (ou porta configurada em `FRONTEND_URL`)
- [ ] Testar backend com: `.\scripts\test-cookie-auth.ps1`

---

## 🔧 Etapa 1: Configurar Cliente HTTP

### Opção A: Fetch API

- [ ] Criar arquivo `lib/api.ts` ou `utils/api.ts`
- [ ] Adicionar função `apiRequest` com `credentials: 'include'`
- [ ] Criar helpers: `api.get()`, `api.post()`, `api.put()`, `api.delete()`
- [ ] Configurar `API_BASE_URL` via variável de ambiente

**Arquivo de exemplo:** [`FRONTEND_HTTP_CLIENT_EXAMPLE.md`](./FRONTEND_HTTP_CLIENT_EXAMPLE.md#-opção-1-fetch-api-recomendado)

### Opção B: Axios

- [ ] Instalar: `npm install axios`
- [ ] Criar arquivo `lib/axios.ts`
- [ ] Configurar instância com `withCredentials: true`
- [ ] (Opcional) Adicionar interceptors para tratamento de erros

**Arquivo de exemplo:** [`FRONTEND_HTTP_CLIENT_EXAMPLE.md`](./FRONTEND_HTTP_CLIENT_EXAMPLE.md#-opção-2-axios)

---

## 🗑️ Etapa 2: Remover Código Antigo (localStorage)

Busque e **REMOVA** estas linhas de código:

- [ ] ❌ `localStorage.setItem('token', ...)`
- [ ] ❌ `localStorage.getItem('token')`
- [ ] ❌ `localStorage.removeItem('token')`
- [ ] ❌ `sessionStorage.setItem('token', ...)`
- [ ] ❌ `headers: { Authorization: 'Bearer ' + token }`
- [ ] ❌ Qualquer manipulação manual de tokens JWT no frontend

**Por quê?** O cookie é gerenciado automaticamente pelo navegador e backend.

---

## 🔐 Etapa 3: Atualizar Serviço de Autenticação

Crie ou atualize `services/auth.ts`:

- [ ] Função `login(email, password)` - retorna apenas `user`, sem token
- [ ] Função `checkAuth()` - verifica se usuário está autenticado
- [ ] Função `logout()` - chama endpoint `/auth/logout`
- [ ] Remover qualquer código que salve/leia token do localStorage

**Exemplo completo:** [`FRONTEND_HTTP_CLIENT_EXAMPLE.md`](./FRONTEND_HTTP_CLIENT_EXAMPLE.md#usar-o-cliente-nas-chamadas-de-autenticação)

---

## 🛡️ Etapa 4: Implementar AuthGuard

Para proteger rotas privadas:

### Next.js (App Router)

- [ ] Criar `components/AuthGuard.tsx`
- [ ] Usar `useEffect` para chamar `checkAuth()`
- [ ] Redirecionar para `/login` se não autenticado
- [ ] Envolver rotas protegidas com `<AuthGuard>`

**Exemplo:** [`FRONTEND_HTTP_CLIENT_EXAMPLE.md`](./FRONTEND_HTTP_CLIENT_EXAMPLE.md#-authguard--protected-routes)

### Next.js (Pages Router)

- [ ] Criar HOC `withAuth()` ou usar `getServerSideProps`
- [ ] Verificar autenticação antes de renderizar página

### React Router

- [ ] Criar componente `ProtectedRoute`
- [ ] Verificar autenticação e redirecionar se necessário

---

## 📄 Etapa 5: Atualizar Páginas

### Página de Login

- [ ] Remover código que salva token no localStorage
- [ ] Após login bem-sucedido, apenas redirecionar (cookie já foi definido)
- [ ] Tratar erros adequadamente

**Exemplo:** [`FRONTEND_HTTP_CLIENT_EXAMPLE.md`](./FRONTEND_HTTP_CLIENT_EXAMPLE.md#-exemplo-completo-de-login)

### Botão/Função de Logout

- [ ] Chamar endpoint `/auth/logout`
- [ ] Redirecionar para `/login` após logout
- [ ] Não precisa limpar localStorage (não há token lá)

**Exemplo:** [`FRONTEND_HTTP_CLIENT_EXAMPLE.md`](./FRONTEND_HTTP_CLIENT_EXAMPLE.md#-exemplo-de-logout)

---

## 🌍 Etapa 6: Variáveis de Ambiente

Crie `.env.local` (Next.js) ou `.env` (Vite/CRA):

- [ ] Adicionar `NEXT_PUBLIC_API_URL=http://localhost:3000/v1`
- [ ] OU `VITE_API_URL=http://localhost:3000/v1`
- [ ] OU `REACT_APP_API_URL=http://localhost:3000/v1`

Em **produção**:

- [ ] Atualizar com URL real: `https://api.seudominio.com/v1`

---

## 🧪 Etapa 7: Testar no Navegador

### DevTools - Application Tab

- [ ] Após login, verificar se cookie `auth_token` foi criado
- [ ] Cookie deve ter:
  - ✅ `HttpOnly: true`
  - ✅ `Secure: false` (dev) ou `true` (prod)
  - ✅ `SameSite: Lax` (dev) ou `Strict` (prod)
  - ✅ `Path: /`
  - ✅ `Expires/Max-Age` configurado

### DevTools - Network Tab

- [ ] Requisição de login deve retornar `Set-Cookie` header
- [ ] Requisições subsequentes devem incluir `Cookie: auth_token=...`
- [ ] Endpoint `/auth/check` deve retornar `200 OK` quando autenticado

### Funcionalidades

- [ ] ✅ Login funciona
- [ ] ✅ Redirecionamento após login
- [ ] ✅ Acesso a rotas protegidas
- [ ] ✅ Logout funciona
- [ ] ✅ Redirecionamento após logout
- [ ] ✅ Refresh da página mantém autenticação
- [ ] ✅ Abrir em nova aba mantém autenticação

---

## 🚨 Etapa 8: Tratamento de Erros

Implemente tratamento para:

- [ ] `401 Unauthorized` → Redirecionar para `/login`
- [ ] Erro de rede → Mostrar mensagem amigável
- [ ] Cookie expirado → Logout automático

**Exemplo com Axios:**
```typescript
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 📦 Etapa 9: Deploy

### Backend

- [ ] Definir `NODE_ENV=production`
- [ ] Configurar HTTPS (SSL/TLS)
- [ ] Atualizar `FRONTEND_URL` com domínio de produção
- [ ] Verificar que `secure: true` está ativo em produção

### Frontend

- [ ] Atualizar `NEXT_PUBLIC_API_URL` (ou equivalente) para URL de produção
- [ ] Testar em HTTPS
- [ ] Verificar CORS (deve aceitar domínio de produção)

---

## ✅ Etapa 10: Validação Final

### Desenvolvimento

- [ ] Todos os testes locais passaram
- [ ] Nenhum erro no console do navegador
- [ ] Nenhum erro no console do backend
- [ ] DevTools mostra cookie sendo enviado em requisições

### Produção

- [ ] Login funciona em HTTPS
- [ ] Cookie com `Secure: true`
- [ ] CORS configurado corretamente
- [ ] Sem erros 401 inesperados
- [ ] Navegação entre páginas funciona
- [ ] Refresh mantém autenticação

---

## 📚 Recursos Adicionais

- [Documentação Completa da Migração](./COOKIE_AUTH_MIGRATION.md)
- [Exemplos de Código para Frontend](./FRONTEND_HTTP_CLIENT_EXAMPLE.md)
- [Teste do Backend (PowerShell)](./scripts/test-cookie-auth.ps1)

---

## 🐛 Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| Cookie não definido | Falta `credentials: true` no CORS | Verificar `app.ts` do backend |
| Cookie não enviado | Falta `credentials: 'include'` | Adicionar em todas as requisições |
| 401 após login | Domínios diferentes | Usar mesma base (ambos localhost) |
| Cookie expira rápido | `maxAge` muito baixo | Aumentar em `auth.controller.ts` |
| Erro de CORS | `FRONTEND_URL` incorreta | Verificar `.env` do backend |

---

## 🎉 Conclusão

Após completar este checklist:

✅ Seu frontend estará usando autenticação segura via cookies HttpOnly  
✅ Proteção contra ataques XSS  
✅ Experiência do usuário melhorada (sem gerenciamento manual de tokens)  
✅ Código mais limpo e seguro  

**Questões?** Consulte [`COOKIE_AUTH_MIGRATION.md`](./COOKIE_AUTH_MIGRATION.md#-troubleshooting) ou [`FRONTEND_HTTP_CLIENT_EXAMPLE.md`](./FRONTEND_HTTP_CLIENT_EXAMPLE.md)
