# Scripts de Utilidade

Este diretório contém scripts auxiliares para o projeto.

---

## 📜 Scripts Disponíveis

### `create-admin.ts`
Cria um usuário administrador padrão no banco de dados.

**Uso:**
```bash
npx ts-node scripts/create-admin.ts
```

**Credenciais criadas:**
- Email: `admin@test.com`
- Senha: `admin123`
- Role: `admin`

---

### `test-cookie-auth.ps1`
Script PowerShell para testar a autenticação via cookies HttpOnly.

**Uso:**
```powershell
.\scripts\test-cookie-auth.ps1
```

**O que testa:**
1. ✅ Login e definição de cookie `auth_token`
2. ✅ Verificação de autenticação via `/auth/check`
3. ✅ Acesso a rota protegida (listagem de quotes)
4. ✅ Logout e remoção do cookie
5. ✅ Confirmação de não-autenticação após logout

**Pré-requisitos:**
- Backend rodando em `http://localhost:3000`
- Usuário admin criado (use `create-admin.ts`)
- PowerShell 5.1 ou superior

**Exemplo de saída:**
```
🍪 Testando Autenticação com Cookies HttpOnly

1️⃣  Testando LOGIN...
   ✅ Status: 200
   ✅ Cookie 'auth_token' definido com sucesso!

2️⃣  Testando VERIFICAÇÃO DE AUTENTICAÇÃO...
   ✅ Status: 200
   ✅ Authenticated: True

3️⃣  Testando ROTA PROTEGIDA...
   ✅ Status: 200

4️⃣  Testando LOGOUT...
   ✅ Status: 200
   ✅ Cookie removido com sucesso!

5️⃣  Testando que NÃO está mais autenticado...
   ✅ Não autenticado (401 Unauthorized)

✅ TODOS OS TESTES PASSARAM!
```

---

## 📚 Documentação Relacionada

- [Migração para Cookies HttpOnly](../COOKIE_AUTH_MIGRATION.md)
- [Exemplos de Cliente HTTP para Frontend](../FRONTEND_HTTP_CLIENT_EXAMPLE.md)
- [Checklist de Migração do Frontend](../FRONTEND_MIGRATION_CHECKLIST.md)
