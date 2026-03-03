# Claude / IA Instructions: Launchcloud Klass Backend

## Como Você Deve Ajudar no Projeto

Este projeto utiliza **Clean Architecture** em **Node.js + TypeScript + Express**.
Sempre que for sugerir código, corrigir bugs ou criar novas features, siga as regras abaixo:

### 1. Camadas da Arquitetura (Respeite as Fronteiras)

A regra de ouro é: **Dependências apontam sempre para o centro** (Domain).

- **`src/domain`**: Crie classes TS puras. Sem `import express`, sem `import mongoose`, etc. É o coração do negócio. Coloque aqui Interfaces de Repositório (`IUserRepository`).
- **`src/application`**: Crie Casos de Uso (Use Cases). Injetamos os repositórios nestas classes através das interfaces, não da implementação concreta.
- **`src/infrastructure`**: Aqui vai tudo que é "sujo" (Express, HTTP Controllers, Conexões de Banco de Dados, Repositórios Reais).

### 2. Padrões de Código

- **Gerenciador de Dependências**: Use somente `yarn`.
- **Linter/Formatador**: O projeto usa regras estritas (ESLint + Prettier). Respeite aspas simples, ponto e vírgula, e tabWidth 2.
- **Tipagem**: Seja rigoroso. Evite `any`. Utilize DTOs (Data Transfer Objects) na borda da aplicação.

### 3. Exemplo de Fluxo

Ao criar uma nova Feature (ex: "Criar Curso"):

1. Crie a entidade `Course` em `src/domain/Course.ts`.
2. Crie a interface `ICourseRepository` em `src/domain/ICourseRepository.ts`.
3. Crie o caso de uso `CreateCourseUseCase` em `src/application/CreateCourseUseCase.ts` (recebendo a interface no construtor).
4. Crie a implementação real do repositório em `src/infrastructure/database/repositories/CourseRepository.ts`.
5. Crie a rota e o controlador em `src/infrastructure/http/controllers/CourseController.ts`.

> Mantenha suas propostas focadas neste padrão e o sistema permanecerá sustentável e limpo a longo prazo.
