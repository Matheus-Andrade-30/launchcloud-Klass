### 📋 Requisitos Funcionais (RFs)

* **RF-01:** O sistema deve **[armazenar] [os dados de perfil de professores e alunos] [em um banco de dados relacional Amazon RDS]**.
* **RF-02:** O sistema deve **[criar] [novas salas de aula virtuais] [mediante solicitação autenticada de um usuário com perfil de professor]**.
* **RF-03:** O sistema deve **[matricular] [alunos] [nas salas de aula previamente criadas e ativas no sistema]**.
* **RF-04:** O sistema deve **[realizar o upload] [de arquivos de materiais didáticos (PDFs, imagens)] [diretamente para um bucket do Amazon S3 utilizando URLs temporárias (presigned URLs)]**.
* **RF-05:** O sistema deve **[listar] [os materiais didáticos publicados] [apenas para os alunos que estiverem devidamente matriculados na respectiva sala de aula]**.
* **RF-06:** O sistema deve **[gerar] [certificados de conclusão de módulo em formato PDF] [de forma automatizada e assíncrona utilizando uma função AWS Lambda]**.
* **RF-07:** O sistema deve **[expor] [os endpoints da API REST] [através do Amazon API Gateway para receber as requisições do frontend]**.
* **RF-08:** O sistema deve **[registrar] [as notas e a frequência dos alunos] [apenas quando a requisição for enviada pelo professor responsável pela turma]**.