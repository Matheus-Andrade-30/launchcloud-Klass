### 💰 Estimativa de Custo Inicial (Cenário: Uso Baixo/Desenvolvimento)

**1. Amazon EC2 (Hospedagem do Servidor Node.js)**

* **Descrição:** Instância para rodar o backend Express.
* 
**Configuração na Calculadora:** 1 instância, sistema operacional Linux, tipo `t2.micro` (ou `t3.micro`), uso de 100% (730 horas/mês). Armazenamento EBS de 30 GB (gp3).


* **Custo Estimado (Tabela):** ~US$ 9,00 / mês
* 
*Nota Free Tier:* Custo real US$ 0,00 nos primeiros 12 meses (750h/mês gratuitas).



**2. Amazon RDS (Banco de Dados Relacional)**

* 
**Descrição:** Banco de dados MySQL ou PostgreSQL para as entidades do sistema.


* 
**Configuração na Calculadora:** 1 instância, tipo `db.t2.micro`, Single-AZ, armazenamento de 20 GB de uso geral (SSD).


* **Custo Estimado (Tabela):** ~US$ 15,00 / mês
* 
*Nota Free Tier:* Custo real US$ 0,00 nos primeiros 12 meses (750h/mês gratuitas).



**3. Amazon S3 (Armazenamento de Arquivos)**

* 
**Descrição:** Armazenamento de materiais didáticos e imagens de perfil.


* 
**Configuração na Calculadora:** S3 Standard, 5 GB de armazenamento por mês. 1.000 requisições PUT, 10.000 requisições GET. Transferência de dados de saída: 1 GB.


* **Custo Estimado:** ~US$ 0,25 / mês

**4. Amazon API Gateway (Interface da API)**

* 
**Descrição:** Ponto de entrada público para a API REST.


* **Configuração na Calculadora:** API REST, estimativa de 100.000 requisições por mês.
* **Custo Estimado:** ~US$ 0,35 / mês

**5. AWS Lambda (Processamento Serverless)**

* 
**Descrição:** Função para gerar os certificados em PDF.


* **Configuração na Calculadora:** 10.000 invocações por mês, tempo de execução médio de 2000 ms, memória alocada de 512 MB.
* 
**Custo Estimado (Tabela):** ~US$ 0,00 (O Free Tier cobre 1 milhão de invocações mensais de forma vitalícia).



**6. Amazon CloudWatch (Observabilidade)**

* 
**Descrição:** Monitoramento e logs da aplicação.


* **Configuração na Calculadora:** 1 GB de logs ingeridos por mês.
* **Custo Estimado:** ~US$ 0,50 / mês

---

**Total Estimado Bruto (Sem aplicar os descontos do Free Tier):** ~US$ 25,10 / mês.


https://calculator.aws/#/estimate?id=d29073a49b36923a6b9f9f2fa9959b7b77905964