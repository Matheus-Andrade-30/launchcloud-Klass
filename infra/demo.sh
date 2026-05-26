#!/bin/bash
# =============================================================================
# 1. Dar permissão de execução para o script de demonstração
# chmod +x demo.sh
# 2. Rodar a demonstração!
# ./demo.sh

# https://claude.ai/public/artifacts/2cd770b2-1b60-4830-be03-793ce9ecbc0a
# =============================================================================

export AWS_PAGER=""
FUNCTION_NAME="klass-api"
REGION="us-east-1"

# Cores
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
MAGENTA='\033[35m'
RED='\033[31m'
BOLD='\033[1m'
RESET='\033[0m'

header()  { echo -e "\n${BOLD}${MAGENTA}═══════════════════════════════════════════════════════════${RESET}"; echo -e "${BOLD}${MAGENTA}  $1${RESET}"; echo -e "${BOLD}${MAGENTA}═══════════════════════════════════════════════════════════${RESET}"; }
section() { echo -e "\n${BOLD}${CYAN}▸ $1${RESET}"; }
info()    { echo -e "${YELLOW}  ↳ $1${RESET}"; }
pause()   { echo -e "\n${YELLOW}Pressione ENTER para continuar...${RESET}"; read -r; }

# Função para invocar a Lambda simulando HTTP request
invoke_api() {
    local METHOD="$1"
    local URLPATH="$2"
    local BODY="$3"

    # Construir payload usando python3 (mais seguro usando sys.argv)
    python3 -c "
import sys, json, time
url_path = sys.argv[1]
method = sys.argv[2]
body_str = sys.argv[3]

payload = {
    'version': '2.0',
    'routeKey': '\$default',
    'rawPath': url_path,
    'rawQueryString': '',
    'headers': {
        'host': 'lambda',
        'content-type': 'application/json'
    },
    'requestContext': {
        'accountId': '176741405308',
        'apiId': 'lambda',
        'domainName': 'lambda',
        'domainPrefix': 'lambda',
        'http': {
            'method': method,
            'path': url_path,
            'protocol': 'HTTP/1.1',
            'sourceIp': '127.0.0.1',
            'userAgent': 'klass-demo'
        },
        'requestId': f'demo-{int(time.time())}',
        'routeKey': '\$default',
        'stage': '\$default',
        'time': '08/May/2026:00:00:00 +0000',
        'timeEpoch': int(time.time()) * 1000
    },
    'isBase64Encoded': False
}

if body_str.strip():
    try:
        # validate if it's json
        json.loads(body_str)
        payload['body'] = body_str.strip()
    except:
        payload['body'] = body_str.strip()

with open('/tmp/klass-demo-payload.json', 'w') as f:
    json.dump(payload, f)
" "$URLPATH" "$METHOD" "$BODY"

    rm -f /tmp/klass-demo-out.json
    aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --region "$REGION" \
        --cli-binary-format raw-in-base64-out \
        --payload file:///tmp/klass-demo-payload.json \
        /tmp/klass-demo-out.json >/dev/null 2>&1

    # Parsear e exibir resposta
    python3 -c "
import json
try:
    with open('/tmp/klass-demo-out.json') as f:
        r = json.load(f)
    status = r.get('statusCode', '?')
    color = '\033[32m' if str(status).startswith('2') else '\033[31m'
    print(f'  \033[33m[$METHOD $URLPATH]\033[0m → Status: {color}{status}\033[0m')
    body = r.get('body', '')
    if body:
        parsed = json.loads(body)
        formatted = json.dumps(parsed, indent=2, ensure_ascii=False)
        # Limitar output a 40 linhas
        lines = formatted.split('\n')
        if len(lines) > 40:
            print('\n'.join(lines[:40]))
            print(f'  ... (+{len(lines)-40} linhas)')
        else:
            print(formatted)
    else:
        print('  (sem body)')
except Exception as e:
    print(f'  Erro: {e}')
" 2>/dev/null
}

# =============================================================================
clear
echo ""
echo -e "${BOLD}${MAGENTA}"
echo "  ██╗  ██╗██╗      █████╗ ███████╗███████╗"
echo "  ██║ ██╔╝██║     ██╔══██╗██╔════╝██╔════╝"
echo "  █████╔╝ ██║     ███████║███████╗███████╗"
echo "  ██╔═██╗ ██║     ██╔══██║╚════██║╚════██║"
echo "  ██║  ██╗███████╗██║  ██║███████║███████║"
echo "  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝"
echo ""
echo "  Plataforma de Gestão de Sala de Aula"
echo "  Demo da API — Lambda + RDS + S3"
echo -e "${RESET}"
pause

# =============================================================================
header "1. HEALTH CHECK"
# =============================================================================
section "Verificando se a API está online..."
invoke_api "GET" "/health"
pause

# =============================================================================
header "2. USUÁRIOS (CRUD)"
# =============================================================================

section "2.1 — Listar todos os usuários"
invoke_api "GET" "/users"
pause

section "2.2 — Criar novo usuário (Professor)"
invoke_api "POST" "/users" "{\"name\":\"Prof. Demo Silva\",\"email\":\"demo.silva.$(date +%s)@klass.edu\",\"role\":\"teacher\"}"
pause

section "2.3 — Buscar usuário por ID (u-s1 — Lucas Oliveira)"
invoke_api "GET" "/users/u-s1"
pause

section "2.4 — Atualizar usuário (u-t1 — Professor)"
invoke_api "PUT" "/users/u-t1" '{"name":"Prof. Carlos Atualizado","email":"carlos.updated@klass.edu","role":"teacher"}'
pause

# =============================================================================
header "3. TURMAS (CRUD)"
# =============================================================================

section "3.1 — Listar todas as turmas"
invoke_api "GET" "/classes"
pause

section "3.2 — Criar nova turma"
invoke_api "POST" "/classes" '{"title":"AWS Cloud Computing","description":"Curso de infraestrutura na nuvem com Lambda, S3 e RDS","teacherId":"u-t1"}'
pause

section "3.3 — Buscar turma por ID (c-1 — Matemática Avançada)"
invoke_api "GET" "/classes/c-1"
pause

# =============================================================================
header "4. MATRÍCULAS"
# =============================================================================

section "4.1 — Listar todas as matrículas"
invoke_api "GET" "/enrollments"
pause

section "4.2 — Criar nova matrícula (aluno u-s3, turma c-5)"
invoke_api "POST" "/enrollments" '{"studentId":"u-s3","classId":"c-5"}'
pause

section "4.3 — Buscar matrícula por ID (e-1)"
invoke_api "GET" "/enrollments/e-1"
pause

# =============================================================================
header "5. NOTAS"
# =============================================================================

section "5.1 — Listar todas as notas"
invoke_api "GET" "/grades"
pause

section "5.2 — Criar nova nota (matrícula e-1)"
invoke_api "POST" "/grades" '{"enrollmentId":"e-1","grade":9.5,"attendance":95,"notes":"Excelente desempenho na prova final","teacherId":"u-t1"}'
pause

section "5.3 — Listar notas por matrícula (e-1)"
invoke_api "GET" "/grades/enrollment/e-1"
pause

# =============================================================================
header "6. CERTIFICADOS"
# =============================================================================

section "6.1 — Gerar certificado (matrícula e-5)"
info "Este endpoint invoca a Lambda de certificados e salva o PDF no S3"
invoke_api "POST" "/certificates/enrollment/e-5" ""
pause

# =============================================================================
header "7. MATERIAIS (S3)"
# =============================================================================

section "7.1 — Listar materiais"
invoke_api "GET" "/materials"
pause

# =============================================================================
header "8. ARQUITETURA AWS"
# =============================================================================
echo ""
echo -e "${CYAN}  ┌─────────────┐     ┌──────────────────┐     ┌──────────┐${RESET}"
echo -e "${CYAN}  │   Client    │────▸│  Lambda Function  │────▸│ RDS MySQL│${RESET}"
echo -e "${CYAN}  │  (este      │     │  URL (Express)    │     │  db.t3   │${RESET}"
echo -e "${CYAN}  │   script)   │     │  klass-api        │     │  .micro  │${RESET}"
echo -e "${CYAN}  └─────────────┘     └────────┬─────────┘     └──────────┘${RESET}"
echo -e "${CYAN}                               │${RESET}"
echo -e "${CYAN}                    ┌──────────┴─────────┐${RESET}"
echo -e "${CYAN}                    │                    │${RESET}"
echo -e "${CYAN}              ┌─────┴──────┐     ┌──────┴─────┐${RESET}"
echo -e "${CYAN}              │  S3 Bucket │     │  Lambda    │${RESET}"
echo -e "${CYAN}              │  Materials │     │  Certif.   │${RESET}"
echo -e "${CYAN}              │  & Certs   │     │  Generator │${RESET}"
echo -e "${CYAN}              └────────────┘     └────────────┘${RESET}"
echo ""
echo -e "${YELLOW}Serviços AWS utilizados:${RESET}"
echo -e "  • ${GREEN}AWS Lambda${RESET}     — API (Express) + Geração de Certificados"
echo -e "  • ${GREEN}Amazon RDS${RESET}     — MySQL 8.0 (db.t3.micro)"
echo -e "  • ${GREEN}Amazon S3${RESET}      — Materiais didáticos e certificados PDF"
echo -e "  • ${GREEN}IAM${RESET}            — Role com policies para S3, Lambda, VPC, Logs"
echo -e "  • ${GREEN}VPC${RESET}            — Security Groups isolando Lambda ↔ RDS"
pause

# =============================================================================
echo ""
echo -e "${BOLD}${MAGENTA}═══════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}"
echo "  ✅ DEMONSTRAÇÃO CONCLUÍDA!"
echo ""
echo "  Todos os endpoints da API Klass foram testados."
echo "  A aplicação roda 100% serverless na AWS usando:"
echo "    • Lambda (API + geração de certificados)"
echo "    • RDS MySQL"
echo "    • S3"
echo -e "${RESET}"
echo -e "${BOLD}${MAGENTA}═══════════════════════════════════════════════════════════${RESET}"
echo ""
