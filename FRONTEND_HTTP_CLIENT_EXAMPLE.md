# 🔌 Exemplo de Cliente HTTP para Frontend

## Configuração com Cookies HttpOnly

Para que o frontend funcione corretamente com autenticação via cookies HttpOnly, é **OBRIGATÓRIO** enviar `credentials: 'include'` em todas as requisições.

---

## 📦 Opção 1: Fetch API (Recomendado)

### Criar um cliente HTTP reutilizável

```typescript
// lib/api.ts ou utils/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    credentials: 'include', // ⚠️ CRÍTICO: envia cookies automaticamente
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP Error ${response.status}`);
  }

  return response.json();
}

// Helpers para métodos HTTP
export const api = {
  get: <T>(endpoint: string) => 
    apiRequest<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  put: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};
```

### Usar o cliente nas chamadas de autenticação

```typescript
// services/auth.ts ou lib/auth.ts

import { api } from './api';

interface LoginResponse {
  message: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

interface CheckAuthResponse {
  authenticated: boolean;
  user: {
    id: number;
    role: string;
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', { email, password });
}

export async function checkAuth(): Promise<CheckAuthResponse> {
  return api.get<CheckAuthResponse>('/auth/check');
}

export async function logout(): Promise<void> {
  return api.post<void>('/auth/logout');
}

// Exemplo de uso de outras rotas protegidas
export async function getQuotes() {
  return api.get('/quotes');
}

export async function createQuote(data: any) {
  return api.post('/quotes', data);
}
```

---

## 📦 Opção 2: Axios

### Instalação

```bash
npm install axios
```

### Configurar instância do Axios

```typescript
// lib/axios.ts ou utils/axios.ts

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ⚠️ CRÍTICO: envia cookies automaticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros global (opcional)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirecionar para login ou limpar estado
      console.error('Não autenticado');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### Usar o cliente Axios

```typescript
// services/auth.ts

import api from './axios';

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function checkAuth() {
  const { data } = await api.get('/auth/check');
  return data;
}

export async function logout() {
  const { data } = await api.post('/auth/logout');
  return data;
}
```

---

## 🛡️ AuthGuard / Protected Routes

### Exemplo com Next.js 14+ (App Router)

```typescript
// components/AuthGuard.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/lib/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        const result = await checkAuth();
        setIsAuthenticated(result.authenticated);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    verify();
  }, [router]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return null; // Ou um componente de loading
  }

  return <>{children}</>;
}
```

### Usar o AuthGuard

```typescript
// app/dashboard/layout.tsx

import { AuthGuard } from '@/components/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
```

---

## 🔄 Exemplo Completo de Login

```typescript
// app/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      console.log('Login bem-sucedido:', result.user);
      
      // ✅ Cookie foi automaticamente definido pelo backend
      // Não precisa fazer nada com localStorage!
      
      router.push('/dashboard'); // Redireciona para área protegida
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
```

---

## 🚪 Exemplo de Logout

```typescript
// components/LogoutButton.tsx

'use client';

import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  return (
    <button onClick={handleLogout}>
      Sair
    </button>
  );
}
```

---

## 🌍 Variáveis de Ambiente (Frontend)

Crie um arquivo `.env.local` no frontend:

```env
# URL da API backend
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
```

**Em produção:**
```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com/v1
```

---

## ⚠️ Checklist de Implementação

- [ ] **Backend rodando** em `http://localhost:3000`
- [ ] **Frontend rodando** em `http://localhost:3001` (ou porta configurada em `FRONTEND_URL`)
- [ ] **CORS configurado** no backend com `credentials: true`
- [ ] **Todas as requisições** usando `credentials: 'include'` ou `withCredentials: true`
- [ ] **Variável `NEXT_PUBLIC_API_URL`** configurada no `.env.local`
- [ ] **Remover código antigo** que usa `localStorage.setItem('token', ...)`

---

## 🐛 Troubleshooting

### ❌ Erro: `401 Unauthorized` no `/auth/check`

**Causa:** Cookie não está sendo enviado na requisição.

**Solução:**
1. Verificar se `credentials: 'include'` está presente
2. Confirmar que frontend e backend estão em portas corretas
3. Inspecionar DevTools > Network > Request Headers e verificar se `Cookie: auth_token=...` está presente

### ❌ Cookie não aparece no DevTools

**Causa:** Cookie não foi definido após o login.

**Solução:**
1. Verificar resposta do `/auth/login` no DevTools > Network > Response Headers
2. Deve conter `Set-Cookie: auth_token=...`
3. Confirmar que `FRONTEND_URL` no backend corresponde à origem do frontend

### ❌ Erro de CORS

**Causa:** Backend não está permitindo credenciais cross-origin.

**Solução:**
1. Verificar se backend tem `credentials: true` no CORS
2. Confirmar que `FRONTEND_URL` está correta no `.env` do backend
3. Reiniciar o servidor backend após mudanças

### ❌ Cookie expira muito rápido

**Causa:** `maxAge` configurado como 1 hora (padrão).

**Solução (Backend):**
```typescript
res.cookie('auth_token', token, {
  // ...
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
});
```

---

## 📚 Diferenças vs. localStorage

| Aspecto | localStorage (antigo) | HttpOnly Cookie (novo) |
|---------|----------------------|------------------------|
| **Acesso JS** | ✅ Sim (inseguro) | ❌ Não (seguro) |
| **Proteção XSS** | ❌ Não | ✅ Sim |
| **Proteção CSRF** | ✅ Sim | ✅ Sim (com sameSite) |
| **Envio automático** | ❌ Manual | ✅ Automático |
| **Código necessário** | `localStorage.setItem()` | `credentials: 'include'` |

---

**✅ Com essas configurações, o frontend funcionará perfeitamente com autenticação via cookies HttpOnly!**
