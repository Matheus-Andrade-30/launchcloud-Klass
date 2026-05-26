# Estimativa de Custo — Klass EdTech Platform (AWS)

**Data:** Maio 2026 | **Região:** us-east-1 | **Moeda:** USD

---

## Premissas por Cenário

| Parâmetro | Baixo (MVP) | Médio (Crescimento) | Alto (Escala) |
|---|---|---|---|
| Alunos ativos/mês | 50 | 500 | 5.000 |
| Requisições API/mês | 50.000 | 500.000 | 5.000.000 |
| Duração média Lambda | 200 ms | 300 ms | 400 ms |
| Upload de materiais/mês | 1 GB | 10 GB | 100 GB |
| Storage S3 acumulado | 2 GB | 25 GB | 300 GB |
| Logs CloudWatch/mês | 0,5 GB | 3 GB | 20 GB |
| Telemetria antifraude/mês | 0,5 GB | 5 GB | 50 GB |

---

## Detalhamento de Custos

### 1. AWS Lambda (`klass-app` — nodejs20.x, 512 MB)

> Free Tier: 1M requisições/mês + 400.000 GB-s/mês (primeiro ano)

| Componente | Baixo | Médio | Alto |
|---|---|---|---|
| Requisições (após free tier) | $0,00 | $0,00 | $0,80 |
| Compute (GB-s) | $0,00 | $0,83 | $16,67 |
| **Subtotal Lambda** | **$0,00** | **$0,83** | **$17,47** |

*Cálculo: 5M req × $0,20/1M = $1,00; 5M × 0,4s × 0,5GB = 1.000.000 GB-s, free tier 400k, cobrado 600k × $0,0000166667 = $10,00*

---

### 2. Amazon API Gateway (HTTP API v2)

> Preço: $1,00 por 1 milhão de requisições

| Cenário | Requisições | Custo |
|---|---|---|
| Baixo | 50.000 | $0,05 |
| Médio | 500.000 | $0,50 |
| Alto | 5.000.000 | $5,00 |

---

### 3. Amazon RDS — MySQL 8.0 (`db.t3.micro`)

> $0,017/hora — instância rodando 24/7 (730h/mês)
> Storage: $0,115/GB/mês (gp2) — alocado 20 GB

| Componente | Todos os cenários |
|---|---|
| Instância db.t3.micro | $12,41/mês |
| Storage 20 GB gp2 | $2,30/mês |
| Backup automático (7 dias) | ~$0,50/mês |
| **Subtotal RDS** | **~$15,21/mês** |

*Nota: maior custo fixo do sistema. Pode ser reduzido com RDS Aurora Serverless v2 em produção real.*

---

### 4. Amazon S3

> Storage: $0,023/GB/mês | PUT: $0,005/1K | GET: $0,0004/1K

| Componente | Baixo | Médio | Alto |
|---|---|---|---|
| Storage (materiais + telemetria) | $0,05 | $0,58 | $6,90 |
| PUT requests | $0,01 | $0,08 | $0,75 |
| GET requests | $0,01 | $0,10 | $1,00 |
| **Subtotal S3** | **$0,07** | **$0,76** | **$8,65** |

---

### 5. Amazon CloudWatch Logs

> Ingestão: $0,50/GB | Storage: $0,03/GB/mês (primeiros 5 GB grátis)

| Cenário | Logs ingeridos | Custo |
|---|---|---|
| Baixo | 0,5 GB | $0,00 (free tier) |
| Médio | 3 GB | $0,00 (free tier) |
| Alto | 20 GB | $7,50 |

---

### 6. AWS Rekognition (Módulo Antifraude)

> DetectFaces: $0,001/imagem | CompareFaces: $0,001/imagem
> Free tier: 5.000 imagens/mês (primeiro ano)

| Cenário | Imagens/mês | Custo |
|---|---|---|
| Baixo | 2.000 | $0,00 (free tier) |
| Médio | 20.000 | $15,00 |
| Alto | 200.000 | $195,00 |

---

## Resumo Mensal Total

| Serviço | Baixo (MVP) | Médio (Crescimento) | Alto (Escala) |
|---|---|---|---|
| AWS Lambda | $0,00 | $0,83 | $17,47 |
| API Gateway HTTP | $0,05 | $0,50 | $5,00 |
| Amazon RDS | $15,21 | $15,21 | $15,21 |
| Amazon S3 | $0,07 | $0,76 | $8,65 |
| CloudWatch Logs | $0,00 | $0,00 | $7,50 |
| AWS Rekognition | $0,00 | $15,00 | $195,00 |
| **TOTAL/mês (USD)** | **~$15,33** | **~$32,30** | **~$248,83** |
| **TOTAL/mês (BRL ~5,10)** | **~R$ 78** | **~R$ 165** | **~R$ 1.269** |

---

## Análise de Custo por Aluno

| Cenário | Custo total | Alunos | Custo/aluno/mês |
|---|---|---|---|
| Baixo | $15,33 | 50 | $0,31 |
| Médio | $32,30 | 500 | $0,06 |
| Alto | $248,83 | 5.000 | $0,05 |

> **Conclusão:** A arquitetura serverless escala de forma eficiente — o custo por aluno cai de $0,31 (MVP) para $0,05 (escala), demonstrando o benefício do modelo pay-per-use da AWS.

---

## Oportunidades de Otimização

1. **Reserved Instances (RDS):** Comprometendo 1 ano, o db.t3.micro cai de $12,41 para ~$7,74/mês (-38%).
2. **S3 Intelligent-Tiering:** Materiais antigos migram automaticamente para camadas mais baratas.
3. **Lambda Power Tuning:** Ajustar memória de 512 MB para 256 MB pode reduzir custo compute em até 40%.
4. **CloudWatch Log Retention:** Configurar retenção de 30 dias evita acúmulo de custo de storage.
5. **RDS Aurora Serverless v2:** Para tráfego variável, cobra apenas quando há queries ativas.

---

*Estimativa baseada nos preços públicos AWS de maio 2026 (us-east-1). Valores reais podem variar com uso de Data Transfer, Savings Plans e variações de pricing.*

---

## Referência — AWS Pricing Calculator

Estimativa base gerada na AWS Pricing Calculator (cenário de uso baixo/desenvolvimento):

**Link:** https://calculator.aws/#/estimate?id=d29073a49b36923a6b9f9f2fa9959b7b77905964

Os cenários Médio e Alto foram projetados aplicando fatores de escala sobre os preços unitários oficiais da calculadora:
- Lambda: $0,20/1M req + $0,0000166667/GB-s
- API Gateway HTTP: $1,00/1M req
- RDS db.t3.micro: $0,017/hora (us-east-1)
- S3 Standard: $0,023/GB/mês
- Rekognition: $0,001/imagem
