# 🧪 Script de Teste - Autenticação Allianz
# Testa se a autenticação com a API Allianz está funcionando

Write-Host "🔒 Testando Autenticação com API Allianz" -ForegroundColor Cyan
Write-Host ""

# Ler credenciais do .env
$envFile = Get-Content .env
$username = ($envFile | Where-Object { $_ -match "^ALLIANZ_USERNAME=" }) -replace "ALLIANZ_USERNAME=", ""
$password = ($envFile | Where-Object { $_ -match "^ALLIANZ_PASSWORD=" }) -replace "ALLIANZ_PASSWORD=", ""
$tokenEndpoint = ($envFile | Where-Object { $_ -match "^ALLIANZ_TOKEN_ENDPOINT=" }) -replace "ALLIANZ_TOKEN_ENDPOINT=", ""

if (-not $username -or -not $password -or -not $tokenEndpoint) {
    Write-Host "❌ ERRO: Credenciais não encontradas no .env" -ForegroundColor Red
    Write-Host "   Verifique se ALLIANZ_USERNAME, ALLIANZ_PASSWORD e ALLIANZ_TOKEN_ENDPOINT estão definidos." -ForegroundColor Yellow
    exit 1
}

Write-Host "📍 Configuração:" -ForegroundColor Yellow
Write-Host "   Username: $username" -ForegroundColor White
Write-Host "   Password: $($password.Substring(0, [Math]::Min(4, $password.Length)))****" -ForegroundColor White
Write-Host "   Endpoint: $tokenEndpoint" -ForegroundColor White
Write-Host ""

# Criar Basic Auth header
$credentials = "$($username):$($password)"
$encodedCredentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($credentials))
$authHeader = "Basic $encodedCredentials"

Write-Host "1️⃣  Testando obtenção de token OAuth..." -ForegroundColor Green
Write-Host ""

try {
    $response = Invoke-RestMethod `
        -Uri $tokenEndpoint `
        -Method POST `
        -Headers @{
            "Authorization" = $authHeader
            "Content-Type" = "application/x-www-form-urlencoded"
        } `
        -ErrorAction Stop

    Write-Host "   ✅ TOKEN OBTIDO COM SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   📋 Detalhes:" -ForegroundColor Yellow
    Write-Host "      - Access Token: $($response.access_token.Substring(0, 30))..." -ForegroundColor White
    Write-Host "      - Token Type: $($response.token_type)" -ForegroundColor White
    Write-Host "      - Expires In: $($response.expires_in) segundos" -ForegroundColor White
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ AUTENTICAÇÃO FUNCIONANDO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 Você pode usar ALLIANZ_MOCK_MODE=false no .env" -ForegroundColor Green
    
} catch {
    Write-Host "   ❌ ERRO NA AUTENTICAÇÃO!" -ForegroundColor Red
    Write-Host ""
    
    $errorDetails = $_.Exception
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    Write-Host "   📋 Detalhes do Erro:" -ForegroundColor Yellow
    Write-Host "      - Status Code: $statusCode" -ForegroundColor White
    Write-Host "      - Mensagem: $($errorDetails.Message)" -ForegroundColor White
    Write-Host ""
    
    # Tentar ler o corpo da resposta de erro
    try {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "      - Resposta: $responseBody" -ForegroundColor White
    } catch {
        Write-Host "      - Não foi possível ler o corpo da resposta" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "❌ AUTENTICAÇÃO FALHOU!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Diagnóstico
    Write-Host "🔍 Possíveis Causas:" -ForegroundColor Yellow
    Write-Host ""
    
    if ($statusCode -eq 401) {
        Write-Host "   1. ❌ Credenciais Incorretas" -ForegroundColor Red
        Write-Host "      - Verifique ALLIANZ_USERNAME e ALLIANZ_PASSWORD no .env" -ForegroundColor White
        Write-Host "      - Confirme com Allianz se as credenciais estão ativas" -ForegroundColor White
        Write-Host ""
    }
    
    if ($statusCode -eq 403) {
        Write-Host "   2. 🔐 Autenticação por Certificado (mTLS) Necessária" -ForegroundColor Red
        Write-Host "      - O endpoint usa grant_type=cert" -ForegroundColor White
        Write-Host "      - Pode exigir certificado digital (.p12 ou .pem)" -ForegroundColor White
        Write-Host "      - Contate Allianz para obter o certificado" -ForegroundColor White
        Write-Host ""
    }
    
    if ($statusCode -eq 404) {
        Write-Host "   3. 🌐 Endpoint Incorreto" -ForegroundColor Red
        Write-Host "      - Verifique ALLIANZ_TOKEN_ENDPOINT no .env" -ForegroundColor White
        Write-Host "      - Confirme com Allianz a URL correta" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "📚 Consulte: ALLIANZ_AUTH_TROUBLESHOOTING.md" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔄 Solução Temporária:" -ForegroundColor Yellow
    Write-Host "   Use ALLIANZ_MOCK_MODE=true no .env para continuar desenvolvendo" -ForegroundColor White
    Write-Host ""
    
    exit 1
}

Write-Host "📖 Próximos Passos:" -ForegroundColor Yellow
Write-Host "   1. Configure ALLIANZ_MOCK_MODE=false no .env" -ForegroundColor White
Write-Host "   2. Reinicie o backend: npm run dev" -ForegroundColor White
Write-Host "   3. Teste criando uma cotação pela API" -ForegroundColor White
Write-Host ""
