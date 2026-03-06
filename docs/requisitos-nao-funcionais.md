### ⚙️ Requisitos Não-Funcionais (RNFs)

* **RNF-01: Desempenho (Tempo de Resposta)**
* **Requisito:** A API REST, exposta através do Amazon API Gateway, deve processar e retornar 95% das requisições em segundos.
* **Justificativa:** Em um sistema de gestão de sala de aula, professores e alunos precisam de agilidade para consultar dados, materiais ou registrar presenças. Tempos de resposta altos geram frustração, prejudicam a usabilidade e oneram desnecessariamente os recursos computacionais.


* **RNF-02: Escalabilidade e Disponibilidade**
* **Requisito:** O backend hospedado na AWS, utilizando Lambda e EC2, deve garantir uma disponibilidade de 99,9% e ser capaz de suportar picos de acesso simultâneo.
* **Justificativa:** Plataformas educacionais costumam sofrer com grandes picos de tráfego em momentos específicos, como no início das aulas ou nos prazos finais para a entrega de trabalhos práticos. A arquitetura precisa garantir que o sistema se mantenha acessível e não saia do ar durante essas janelas críticas de avaliação.


* **RNF-03: Segurança e Privacidade (Conformidade com LGPD)**
* **Requisito:** O sistema deve estar em total conformidade com a LGPD no tratamento de dados de alunos e professores, protegendo informações no Amazon RDS e garantindo que o download/upload de arquivos no Amazon S3 seja feito exclusivamente através de URLs temporárias (presigned URLs).
* **Justificativa:** Como o sistema lida com histórico acadêmico e informações pessoais, a segurança é inegociável. Além da proteção legal da startup, o uso estrito de presigned URLs para os arquivos não servidos diretamente pela aplicação é um critério de aceite obrigatório para a Entrega 3 do projeto.


* **RNF-04: Observabilidade e Monitoramento**
* **Requisito:** O sistema deve registrar logs estruturados de todas as requisições com falha (erros 4xx e 5xx) utilizando o Amazon CloudWatch.
* **Justificativa:** Em uma arquitetura distribuída na nuvem, ter visibilidade sobre os erros da API é fundamental para identificar bugs rapidamente, garantindo a estabilidade do sistema para professores e alunos, além de facilitar a manutenção pelo time de desenvolvimento.
