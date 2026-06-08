#!/usr/bin/env bash
# (Re)cria a stack Klass inteira (RDS + Lambdas + API + buckets + SNS + CloudFront) e publica o front.
# Use na hora de apresentar: 1 comando empacota e sobe tudo do zero.
# Pre-requisito: o zip fraud-lambda.zip ja no bucket de deploy (este script empacota
#   e reenvia o backend klass-lambda.zip e o certificate-lambda.zip automaticamente).
set -euo pipefail

REGION="${REGION:-us-east-1}"
STACK="${STACK:-klass}"
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
DEPLOY_BUCKET="${DEPLOY_BUCKET:-klass-deploy-${ACCOUNT}}"
DB_PASSWORD="${DB_PASSWORD:-Klass2026#DbSecure}"
ALERT_EMAIL="${ALERT_EMAIL:-202402630661@alunos.ibmec.edu.br}"

cd "$(dirname "$0")/.."

echo ">> Empacotando o backend (klass-lambda.zip)..."
yarn package:back >/dev/null

echo ">> Empacotando a Lambda de certificado (certificate-lambda.zip)..."
# @aws-sdk/client-s3 ja vem no runtime nodejs22.x — sem node_modules.
( cd certificate-lambda && rm -f ../certificate-lambda.zip && \
  zip -qr ../certificate-lambda.zip index.js package.json )

echo ">> Enviando os zips para o bucket de deploy (${DEPLOY_BUCKET})..."
aws s3 cp klass-lambda.zip "s3://${DEPLOY_BUCKET}/klass-lambda.zip" --region "$REGION"
aws s3 cp certificate-lambda.zip "s3://${DEPLOY_BUCKET}/certificate-lambda.zip" --region "$REGION"

echo ">> (Re)deploy da stack ${STACK} (cria o RDS e o resto)..."
aws cloudformation deploy \
  --template-file infra/aws-cloudformation.yaml \
  --stack-name "$STACK" --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
      DBPassword="$DB_PASSWORD" \
      AppS3Bucket="$DEPLOY_BUCKET" \
      ProfessorAlertEmail="$ALERT_EMAIL"

# CloudFormation nao redeploya a Lambda quando so o conteudo do zip muda (mesma S3Key);
# forcamos a atualizacao do codigo.
echo ">> Atualizando o codigo das Lambdas a partir do S3..."
aws lambda update-function-code --function-name klass-app \
  --s3-bucket "$DEPLOY_BUCKET" --s3-key klass-lambda.zip --region "$REGION" \
  --query 'LastUpdateStatus' --output text >/dev/null || true
aws lambda update-function-code --function-name klass-generate-certificate \
  --s3-bucket "$DEPLOY_BUCKET" --s3-key certificate-lambda.zip --region "$REGION" \
  --query 'LastUpdateStatus' --output text >/dev/null || true

out() { aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text; }
API_URL="$(out ApiGatewayUrl)"
FRONT_BUCKET="$(out FrontBucketName)"
FRONT_URL="$(out FrontUrl)"
FRONT_DIST="$(out FrontDistributionId)"

echo ">> Buildando e publicando o front (VITE_API_URL=${API_URL})..."
( cd frontend && VITE_API_URL="$API_URL" yarn build && \
  aws s3 sync dist "s3://${FRONT_BUCKET}" --delete --region "$REGION" )

echo ">> Invalidando o cache do CloudFront (${FRONT_DIST}) para servir a nova versao..."
aws cloudfront create-invalidation \
  --distribution-id "$FRONT_DIST" --paths "/*" \
  --query 'Invalidation.Id' --output text >/dev/null || true

echo ">> Aquecendo o backend (cria/semeia o banco)..."
curl -s --max-time 90 "${API_URL}/health" >/dev/null || true

cat <<EOF

===================================================
 Klass no ar!
   API:   ${API_URL}
   Front: ${FRONT_URL}   (CloudFront/HTTPS — camera e print de tela funcionam aqui)

 -> O fluxo antifraude completo (webcam + print) roda direto na URL acima.
    (CloudFront entrega HTTPS, que e o contexto seguro exigido pelo getUserMedia.)
 -> CONFIRME a inscricao do SNS no e-mail: ${ALERT_EMAIL}
 -> Obs.: a 1a propagacao do CloudFront leva ~5-15 min apos o deploy inicial.
===================================================
EOF
