#!/usr/bin/env bash
# Derruba a stack Klass (apaga RDS, Lambdas, API, buckets, SNS) -> custo recorrente ~zero.
# Mantem o bucket de deploy (klass-deploy-<conta>) com os zips, para o proximo deploy ser rapido.
set -euo pipefail

REGION="${REGION:-us-east-1}"
STACK="${STACK:-klass}"
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"

echo ">> Esvaziando buckets (CloudFormation nao apaga bucket com conteudo)..."
aws s3 rm "s3://klass-frontend-${ACCOUNT}"  --recursive --region "$REGION" 2>/dev/null || true
aws s3 rm "s3://klass-materials-${ACCOUNT}" --recursive --region "$REGION" 2>/dev/null || true

echo ">> Apagando a stack ${STACK}..."
aws cloudformation delete-stack --stack-name "$STACK" --region "$REGION"
aws cloudformation wait stack-delete-complete --stack-name "$STACK" --region "$REGION"

echo ">> Pronto. RDS removido, custo recorrente ~zero."
echo "   Os zips continuam em s3://klass-deploy-${ACCOUNT} para recriar com ./infra/deploy.sh"
