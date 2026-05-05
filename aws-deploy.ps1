# =============================================================================
# KLASS — AWS DEPLOY SCRIPT (PowerShell)
# Configura toda a infraestrutura AWS automaticamente via AWS CLI
# Pré-requisito: AWS CLI instalado e configurado (aws configure)
# =============================================================================

# --------------- CONFIGURAÇÕES — EDITE AQUI ----------------------------------
$PROJECT     = "klass"
$REGION      = "us-east-1"
$DB_PASSWORD = "KlassDB2026!"          # Mude para uma senha forte
$REPO_URL    = "https://github.com/Matheus-Andrade-30/launchcloud-Klass.git"
$BUCKET_NAME = "klass-materials-2026"  # deve ser único globalmente
# -----------------------------------------------------------------------------

$ErrorActionPreference = "Stop"

function Log($msg)  { Write-Host "`n[INFO] $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "[ERRO] $msg" -ForegroundColor Red; exit 1 }

# =============================================================================
# PRÉ-REQUISITOS
# =============================================================================
Log "Verificando pré-requisitos..."

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Fail "AWS CLI não encontrado. Instale em: https://aws.amazon.com/cli/"
}

$identity = aws sts get-caller-identity --output json 2>&1
if ($LASTEXITCODE -ne 0) {
    Fail "AWS CLI não configurado. Execute: aws configure"
}
$accountId = ($identity | ConvertFrom-Json).Account
Ok "AWS CLI OK — Account: $accountId | Region: $REGION"

# =============================================================================
# PASSO 1 — SECURITY GROUPS
# =============================================================================
Log "Criando Security Groups..."

$defaultVpc = aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" `
    --query "Vpcs[0].VpcId" --output text --region $REGION
Ok "VPC padrão: $defaultVpc"

# Security Group EC2
$ec2SgId = aws ec2 create-security-group `
    --group-name "$PROJECT-ec2-sg" `
    --description "Klass EC2 Security Group" `
    --vpc-id $defaultVpc `
    --query "GroupId" --output text --region $REGION 2>&1

if ($LASTEXITCODE -ne 0) {
    Warn "Security Group EC2 já existe, buscando ID..."
    $ec2SgId = aws ec2 describe-security-groups `
        --filters "Name=group-name,Values=$PROJECT-ec2-sg" `
        --query "SecurityGroups[0].GroupId" --output text --region $REGION
}
Ok "EC2 SG: $ec2SgId"

# Regras EC2: SSH, HTTP e porta 3000
$myIp = (Invoke-RestMethod -Uri "https://checkip.amazonaws.com").Trim()
@(
    @{ port = 22;   cidr = "$myIp/32" },
    @{ port = 80;   cidr = "0.0.0.0/0" },
    @{ port = 3000; cidr = "0.0.0.0/0" }
) | ForEach-Object {
    aws ec2 authorize-security-group-ingress `
        --group-id $ec2SgId `
        --protocol tcp --port $_.port --cidr $_.cidr `
        --region $REGION 2>$null
}
Ok "Regras EC2 configuradas (SSH do IP $myIp, HTTP e 3000 públicos)"

# Security Group RDS
$rdsSgId = aws ec2 create-security-group `
    --group-name "$PROJECT-rds-sg" `
    --description "Klass RDS Security Group" `
    --vpc-id $defaultVpc `
    --query "GroupId" --output text --region $REGION 2>&1

if ($LASTEXITCODE -ne 0) {
    Warn "Security Group RDS já existe, buscando ID..."
    $rdsSgId = aws ec2 describe-security-groups `
        --filters "Name=group-name,Values=$PROJECT-rds-sg" `
        --query "SecurityGroups[0].GroupId" --output text --region $REGION
}

aws ec2 authorize-security-group-ingress `
    --group-id $rdsSgId --protocol tcp --port 3306 `
    --source-group $ec2SgId --region $REGION 2>$null
Ok "RDS SG: $rdsSgId (MySQL liberado somente para EC2)"

# =============================================================================
# PASSO 2 — RDS MySQL
# =============================================================================
Log "Criando banco de dados RDS MySQL..."

aws rds create-db-instance `
    --db-instance-identifier "$PROJECT-db" `
    --db-instance-class db.t3.micro `
    --engine mysql `
    --engine-version "8.0" `
    --master-username admin `
    --master-user-password $DB_PASSWORD `
    --allocated-storage 20 `
    --db-name klass `
    --vpc-security-group-ids $rdsSgId `
    --publicly-accessible `
    --no-multi-az `
    --backup-retention-period 0 `
    --region $REGION 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Warn "RDS já existe ou erro na criação. Continuando..."
}

Ok "RDS criado (aguardando ficar 'available' — pode levar ~10 min em background)"
Ok "Use: aws rds describe-db-instances --db-instance-identifier $PROJECT-db --query 'DBInstances[0].DBInstanceStatus'"

# =============================================================================
# PASSO 3 — KEY PAIR EC2
# =============================================================================
Log "Criando Key Pair para SSH na EC2..."

$keyPath = "$HOME\$PROJECT-keypair.pem"
if (Test-Path $keyPath) {
    Warn "Key pair já existe em $keyPath"
} else {
    aws ec2 create-key-pair `
        --key-name "$PROJECT-keypair" `
        --query "KeyMaterial" --output text `
        --region $REGION | Out-File -FilePath $keyPath -Encoding ascii
    Ok "Key pair salvo em: $keyPath"
    Warn "GUARDE este arquivo! Sem ele não é possível acessar a EC2 via SSH."
}

# =============================================================================
# PASSO 4 — EC2 (com User Data para deploy automático)
# =============================================================================
Log "Criando instância EC2..."

# AMI Amazon Linux 2023 (us-east-1)
$ami = aws ec2 describe-images `
    --owners amazon `
    --filters "Name=name,Values=al2023-ami-*-x86_64" "Name=state,Values=available" `
    --query "sort_by(Images, &CreationDate)[-1].ImageId" `
    --output text --region $REGION
Ok "AMI selecionada: $ami"

# User Data: instala Node, clona repo, configura PM2
$userData = @"
#!/bin/bash
set -e
yum update -y

# Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs git

# Yarn e PM2
npm install -g yarn pm2

# Clonar repositório
cd /home/ec2-user
git clone $REPO_URL app
cd app

# Instalar dependências e compilar
yarn install --frozen-lockfile
yarn build

# O arquivo .env será criado após o script saber o endpoint do RDS
# Por enquanto, cria um placeholder
cat > .env << 'ENVEOF'
PORT=3000
DB_HOST=PLACEHOLDER_WILL_BE_UPDATED
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=$DB_PASSWORD
DB_NAME=klass
AWS_REGION=$REGION
AWS_ACCESS_KEY_ID=PLACEHOLDER
AWS_SECRET_ACCESS_KEY=PLACEHOLDER
S3_BUCKET_NAME=$BUCKET_NAME
LAMBDA_CERTIFICATE_FUNCTION=$PROJECT-generate-certificate
ENVEOF

chown -R ec2-user:ec2-user /home/ec2-user/app

# Iniciar com PM2
su - ec2-user -c "cd /home/ec2-user/app && pm2 start dist/infrastructure/http/server.js --name klass-api && pm2 save"
su - ec2-user -c "pm2 startup systemd -u ec2-user --hp /home/ec2-user" | tail -1 | bash
"@

$userDataB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($userData))

$instanceId = aws ec2 run-instances `
    --image-id $ami `
    --instance-type t2.micro `
    --key-name "$PROJECT-keypair" `
    --security-group-ids $ec2SgId `
    --user-data $userDataB64 `
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$PROJECT-server}]" `
    --query "Instances[0].InstanceId" --output text `
    --region $REGION 2>&1

if ($LASTEXITCODE -ne 0) { Fail "Erro ao criar EC2: $instanceId" }
Ok "EC2 criada: $instanceId (aguardando ficar running...)"

# Aguardar EC2 estar running
aws ec2 wait instance-running --instance-ids $instanceId --region $REGION
$publicIp = aws ec2 describe-instances `
    --instance-ids $instanceId `
    --query "Reservations[0].Instances[0].PublicIpAddress" `
    --output text --region $REGION
Ok "EC2 IP público: $publicIp"

# =============================================================================
# PASSO 5 — S3 BUCKET
# =============================================================================
Log "Criando bucket S3: $BUCKET_NAME..."

aws s3 mb "s3://$BUCKET_NAME" --region $REGION 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Warn "Bucket já existe ou nome ocupado. Tente outro nome em `$BUCKET_NAME." }

# Bloquear acesso público (usaremos presigned URLs)
aws s3api put-public-access-block `
    --bucket $BUCKET_NAME `
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" `
    --region $REGION

# Configurar CORS
$corsConfig = @'
{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET","PUT","POST","DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }]
}
'@
$corsConfig | aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file:///dev/stdin --region $REGION 2>$null

# Alternativa: salva em arquivo temporário
$tmpCors = [System.IO.Path]::GetTempFileName() + ".json"
$corsConfig | Out-File -FilePath $tmpCors -Encoding utf8
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration "file://$tmpCors" --region $REGION 2>$null
Remove-Item $tmpCors -ErrorAction SilentlyContinue

Ok "S3 bucket configurado: $BUCKET_NAME"

# =============================================================================
# PASSO 6 — IAM USER
# =============================================================================
Log "Criando usuário IAM para a aplicação..."

aws iam create-user --user-name "$PROJECT-app-user" 2>$null | Out-Null

# Attach policies
@(
    "arn:aws:iam::aws:policy/AmazonS3FullAccess",
    "arn:aws:iam::aws:policy/AWSLambda_FullAccess"
) | ForEach-Object {
    aws iam attach-user-policy --user-name "$PROJECT-app-user" --policy-arn $_ 2>$null
}

# Criar access key
$keys = aws iam create-access-key --user-name "$PROJECT-app-user" --output json | ConvertFrom-Json
$accessKeyId     = $keys.AccessKey.AccessKeyId
$secretAccessKey = $keys.AccessKey.SecretAccessKey
Ok "IAM User criado | Access Key: $accessKeyId"

# =============================================================================
# PASSO 7 — LAMBDA (Geração de Certificados)
# =============================================================================
Log "Criando função Lambda para geração de certificados..."

# Criar role para a Lambda
$trustPolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
'@
$tmpTrust = [System.IO.Path]::GetTempFileName() + ".json"
$trustPolicy | Out-File -FilePath $tmpTrust -Encoding utf8

$roleArn = aws iam create-role `
    --role-name "$PROJECT-lambda-role" `
    --assume-role-policy-document "file://$tmpTrust" `
    --query "Role.Arn" --output text 2>&1
Remove-Item $tmpTrust -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0) {
    Warn "Role já existe, buscando ARN..."
    $roleArn = aws iam get-role --role-name "$PROJECT-lambda-role" `
        --query "Role.Arn" --output text
}

aws iam attach-role-policy --role-name "$PROJECT-lambda-role" `
    --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess" 2>$null
aws iam attach-role-policy --role-name "$PROJECT-lambda-role" `
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" 2>$null
Ok "Lambda Role: $roleArn"

# Criar código da Lambda
$tmpDir = Join-Path $env:TEMP "klass-lambda"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

@'
exports.handler = async (event) => {
  const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
  const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

  const { certificateId, studentName, className, enrollmentId, s3Key, s3Bucket } = event;

  // Gera um PDF simples em texto puro (sem dependência externa)
  const pdfContent = `%PDF-1.4
1 0 obj<</Type /Catalog /Pages 2 0 R>>endobj
2 0 obj<</Type /Pages /Kids [3 0 R] /Count 1>>endobj
3 0 obj<</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]
/Contents 4 0 R /Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 300>>
stream
BT
/F1 24 Tf
100 750 Td (CERTIFICADO DE CONCLUSAO) Tj
/F1 16 Tf
100 700 Td (Aluno: ${studentName}) Tj
100 670 Td (Curso: ${className}) Tj
100 640 Td (Matricula: ${enrollmentId}) Tj
100 610 Td (ID: ${certificateId}) Tj
/F1 12 Tf
100 550 Td (Data: ${new Date().toLocaleDateString("pt-BR")}) Tj
100 520 Td (Klass - Plataforma de Educacao) Tj
ET
endstream
endobj
5 0 obj<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>endobj
xref
0 6
trailer<</Size 6 /Root 1 0 R>>
startxref
0
%%EOF`;

  const buf = Buffer.from(pdfContent);
  await s3.send(new PutObjectCommand({
    Bucket: s3Bucket,
    Key: s3Key,
    Body: buf,
    ContentType: "application/pdf",
  }));

  return { statusCode: 200, body: JSON.stringify({ certificateId, s3Key }) };
};
'@ | Out-File -FilePath "$tmpDir\index.js" -Encoding utf8

# Zipar
$zipPath = Join-Path $env:TEMP "klass-lambda.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }
Compress-Archive -Path "$tmpDir\*" -DestinationPath $zipPath
Ok "Lambda zip criado: $zipPath"

# Aguardar role propagar (IAM demora ~10s)
Start-Sleep -Seconds 12

# Criar ou atualizar a função Lambda
$lambdaExists = aws lambda get-function --function-name "$PROJECT-generate-certificate" `
    --region $REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    aws lambda update-function-code `
        --function-name "$PROJECT-generate-certificate" `
        --zip-file "fileb://$zipPath" --region $REGION | Out-Null
    Ok "Lambda atualizada"
} else {
    aws lambda create-function `
        --function-name "$PROJECT-generate-certificate" `
        --runtime nodejs20.x `
        --role $roleArn `
        --handler index.handler `
        --zip-file "fileb://$zipPath" `
        --timeout 30 `
        --memory-size 256 `
        --environment "Variables={AWS_REGION=$REGION,S3_BUCKET_NAME=$BUCKET_NAME}" `
        --region $REGION | Out-Null
    Ok "Lambda criada: $PROJECT-generate-certificate"
}
Remove-Item $tmpDir -Recurse -ErrorAction SilentlyContinue

# =============================================================================
# PASSO 8 — API GATEWAY
# =============================================================================
Log "Configurando Amazon API Gateway..."

$apiId = aws apigateway create-rest-api `
    --name "$PROJECT-api-gateway" `
    --description "Klass API Gateway" `
    --endpoint-configuration "types=REGIONAL" `
    --query "id" --output text --region $REGION

$rootId = aws apigateway get-resources `
    --rest-api-id $apiId `
    --query "items[?path=='/'].id" --output text --region $REGION

# Criar recurso proxy {proxy+}
$proxyId = aws apigateway create-resource `
    --rest-api-id $apiId `
    --parent-id $rootId `
    --path-part "{proxy+}" `
    --query "id" --output text --region $REGION

# Configurar método ANY no proxy
aws apigateway put-method `
    --rest-api-id $apiId `
    --resource-id $proxyId `
    --http-method ANY `
    --authorization-type NONE `
    --request-parameters "method.request.path.proxy=true" `
    --region $REGION | Out-Null

# Integração HTTP Proxy com EC2
aws apigateway put-integration `
    --rest-api-id $apiId `
    --resource-id $proxyId `
    --http-method ANY `
    --type HTTP_PROXY `
    --integration-http-method ANY `
    --uri "http://${publicIp}:3000/{proxy}" `
    --request-parameters "integration.request.path.proxy=method.request.path.proxy" `
    --region $REGION | Out-Null

# Método ANY na raiz /
aws apigateway put-method `
    --rest-api-id $apiId `
    --resource-id $rootId `
    --http-method ANY `
    --authorization-type NONE `
    --region $REGION | Out-Null

aws apigateway put-integration `
    --rest-api-id $apiId `
    --resource-id $rootId `
    --http-method ANY `
    --type HTTP_PROXY `
    --integration-http-method ANY `
    --uri "http://${publicIp}:3000/" `
    --region $REGION | Out-Null

# Deploy
aws apigateway create-deployment `
    --rest-api-id $apiId `
    --stage-name prod `
    --region $REGION | Out-Null

$apiUrl = "https://$apiId.execute-api.$REGION.amazonaws.com/prod"
Ok "API Gateway URL: $apiUrl"

# =============================================================================
# PASSO 9 — AGUARDAR RDS E ATUALIZAR .env NA EC2
# =============================================================================
Log "Aguardando RDS ficar disponível (pode levar ~10 min)..."
aws rds wait db-instance-available `
    --db-instance-identifier "$PROJECT-db" `
    --region $REGION

$dbEndpoint = aws rds describe-db-instances `
    --db-instance-identifier "$PROJECT-db" `
    --query "DBInstances[0].Endpoint.Address" `
    --output text --region $REGION
Ok "RDS endpoint: $dbEndpoint"

# =============================================================================
# PASSO 10 — GERAR ARQUIVO .env FINAL E RESUMO
# =============================================================================
Log "Gerando arquivos de saída..."

$envContent = @"
PORT=3000
DB_HOST=$dbEndpoint
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=$DB_PASSWORD
DB_NAME=klass
AWS_REGION=$REGION
AWS_ACCESS_KEY_ID=$accessKeyId
AWS_SECRET_ACCESS_KEY=$secretAccessKey
S3_BUCKET_NAME=$BUCKET_NAME
LAMBDA_CERTIFICATE_FUNCTION=$PROJECT-generate-certificate
"@

$envContent | Out-File -FilePath ".\klass.env" -Encoding utf8
Ok "Arquivo .env salvo em: klass.env (copie para a EC2 como .env)"

$summary = @"
================================================================================
  KLASS — DEPLOY CONCLUÍDO
================================================================================

EC2 IP Público  : $publicIp
EC2 Instance ID : $instanceId
RDS Endpoint    : $dbEndpoint
S3 Bucket       : $BUCKET_NAME
Lambda          : $PROJECT-generate-certificate
API Gateway URL : $apiUrl

ENDPOINTS:
  Health    : $apiUrl/health
  Swagger   : $apiUrl/api-docs
  Users     : $apiUrl/users
  Classes   : $apiUrl/classes
  Materials : $apiUrl/materials

PRÓXIMOS PASSOS:
1. Copie o arquivo .env para a EC2:
   scp -i $keyPath klass.env ec2-user@${publicIp}:/home/ec2-user/app/.env

2. Reinicie a aplicação na EC2:
   ssh -i $keyPath ec2-user@$publicIp "cd ~/app && pm2 restart klass-api"

3. Verifique o health:
   curl $apiUrl/health

4. Abra o Swagger:
   $apiUrl/api-docs

CHAVES (guarde com segurança!):
  Key Pair        : $keyPath
  IAM Access Key  : $accessKeyId
  IAM Secret Key  : (salvo em klass.env)

ATENÇÃO: Não commite klass.env ou $keyPath no Git!
================================================================================
"@

$summary | Out-File -FilePath ".\deploy-summary.txt" -Encoding utf8
Write-Host $summary -ForegroundColor Green

# =============================================================================
# COPIAR .env PARA EC2 (opcional — requer chave disponível)
# =============================================================================
Log "Tentando copiar .env para a EC2 via SCP..."
Start-Sleep -Seconds 30  # aguardar SSH estar pronto

$scpResult = scp -i $keyPath -o StrictHostKeyChecking=no `
    ".\klass.env" "ec2-user@${publicIp}:/home/ec2-user/app/.env" 2>&1

if ($LASTEXITCODE -eq 0) {
    Ok ".env copiado para EC2"
    ssh -i $keyPath -o StrictHostKeyChecking=no ec2-user@$publicIp `
        "cd ~/app && pm2 restart klass-api 2>/dev/null || pm2 start dist/infrastructure/http/server.js --name klass-api && pm2 save"
    Ok "Aplicação reiniciada na EC2"
} else {
    Warn "SCP falhou (EC2 pode ainda estar inicializando). Copie manualmente:"
    Warn "  scp -i $keyPath klass.env ec2-user@${publicIp}:/home/ec2-user/app/.env"
    Warn "  ssh -i $keyPath ec2-user@$publicIp 'cd ~/app && pm2 restart klass-api'"
}

Write-Host "`n[DONE] Deploy finalizado! Resumo salvo em deploy-summary.txt" -ForegroundColor Green
