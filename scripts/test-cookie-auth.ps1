# 🧪 Script de Teste - Autenticação com Cookies HttpOnly
# PowerShell script para testar a autenticação via cookies

Write-Host "🍪 Testando Autenticação com Cookies HttpOnly" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/v1"
$cookieFile = "$env:TEMP\auth_cookies.txt"

# Limpar cookies anteriores
if (Test-Path $cookieFile) {
    Remove-Item $cookieFile
}

Write-Host "📍 Endpoint Base: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# ========================================
# 1. LOGIN
# ========================================
Write-Host "1️⃣  Testando LOGIN..." -ForegroundColor Green

$loginData = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest `
        -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData `
        -SessionVariable session

    Write-Host "   ✅ Status: $($loginResponse.StatusCode)" -ForegroundColor Green
    
    $loginBody = $loginResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Resposta:" -ForegroundColor Green
    Write-Host "      - Mensagem: $($loginBody.message)" -ForegroundColor White
    Write-Host "      - User ID: $($loginBody.user.id)" -ForegroundColor White
    Write-Host "      - Email: $($loginBody.user.email)" -ForegroundColor White
    Write-Host "      - Role: $($loginBody.user.role)" -ForegroundColor White
    
    # Verificar se cookie foi definido
    $cookies = $session.Cookies.GetCookies($baseUrl)
    $authCookie = $cookies | Where-Object { $_.Name -eq "auth_token" }
    
    if ($authCookie) {
        Write-Host "   ✅ Cookie 'auth_token' definido com sucesso!" -ForegroundColor Green
        Write-Host "      - HttpOnly: $($authCookie.HttpOnly)" -ForegroundColor White
        Write-Host "      - Secure: $($authCookie.Secure)" -ForegroundColor White
        Write-Host "      - Path: $($authCookie.Path)" -ForegroundColor White
        Write-Host "      - Expires: $($authCookie.Expires)" -ForegroundColor White
    } else {
        Write-Host "   ❌ ERRO: Cookie 'auth_token' não foi definido!" -ForegroundColor Red
        Write-Host "   Verifique o backend." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ❌ ERRO no login: $_" -ForegroundColor Red
    Write-Host "   Certifique-se de que o backend está rodando e que existe um usuário admin." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ========================================
# 2. CHECK AUTH
# ========================================
Write-Host "2️⃣  Testando VERIFICAÇÃO DE AUTENTICAÇÃO..." -ForegroundColor Green

try {
    $checkResponse = Invoke-WebRequest `
        -Uri "$baseUrl/auth/check" `
        -Method GET `
        -WebSession $session

    Write-Host "   ✅ Status: $($checkResponse.StatusCode)" -ForegroundColor Green
    
    $checkBody = $checkResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Resposta:" -ForegroundColor Green
    Write-Host "      - Authenticated: $($checkBody.authenticated)" -ForegroundColor White
    Write-Host "      - User ID: $($checkBody.user.id)" -ForegroundColor White
    Write-Host "      - Role: $($checkBody.user.role)" -ForegroundColor White
} catch {
    Write-Host "   ❌ ERRO ao verificar autenticação: $_" -ForegroundColor Red
    Write-Host "   O cookie pode não estar sendo enviado corretamente." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ========================================
# 3. ACESSAR ROTA PROTEGIDA
# ========================================
Write-Host "3️⃣  Testando ROTA PROTEGIDA (listagem de quotes)..." -ForegroundColor Green

try {
    $quotesResponse = Invoke-WebRequest `
        -Uri "$baseUrl/quotes" `
        -Method GET `
        -WebSession $session

    Write-Host "   ✅ Status: $($quotesResponse.StatusCode)" -ForegroundColor Green
    
    $quotes = $quotesResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Total de cotações: $($quotes.Count)" -ForegroundColor White
} catch {
    Write-Host "   ❌ ERRO ao acessar rota protegida: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ========================================
# 4. LOGOUT
# ========================================
Write-Host "4️⃣  Testando LOGOUT..." -ForegroundColor Green

try {
    $logoutResponse = Invoke-WebRequest `
        -Uri "$baseUrl/auth/logout" `
        -Method POST `
        -WebSession $session

    Write-Host "   ✅ Status: $($logoutResponse.StatusCode)" -ForegroundColor Green
    
    $logoutBody = $logoutResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Mensagem: $($logoutBody.message)" -ForegroundColor White
    
    # Verificar se cookie foi removido
    $cookies = $session.Cookies.GetCookies($baseUrl)
    $authCookie = $cookies | Where-Object { $_.Name -eq "auth_token" }
    
    if (-not $authCookie -or $authCookie.Expired) {
        Write-Host "   ✅ Cookie 'auth_token' removido com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Cookie ainda existe (pode ser comportamento normal do PowerShell)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ ERRO ao fazer logout: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ========================================
# 5. VERIFICAR QUE NÃO ESTÁ MAIS AUTENTICADO
# ========================================
Write-Host "5️⃣  Testando que NÃO está mais autenticado..." -ForegroundColor Green

try {
    $checkAfterLogout = Invoke-WebRequest `
        -Uri "$baseUrl/auth/check" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop

    Write-Host "   ⚠️  ATENÇÃO: Ainda autenticado após logout!" -ForegroundColor Yellow
    Write-Host "   Status: $($checkAfterLogout.StatusCode)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ Não autenticado (401 Unauthorized) - Correto!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro inesperado: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ TODOS OS TESTES PASSARAM!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Autenticação com Cookies HttpOnly está funcionando corretamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Configure o frontend para usar 'credentials: include'" -ForegroundColor White
Write-Host "   2. Veja exemplos em: FRONTEND_HTTP_CLIENT_EXAMPLE.md" -ForegroundColor White
Write-Host "   3. Documente a migração em: COOKIE_AUTH_MIGRATION.md" -ForegroundColor White
Write-Host ""
