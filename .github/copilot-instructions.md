---
description: Copilot/Claude Instructions for Launchcloud Klass Backend
---

# Filosofia e Arquitetura do Sistema

## Visão Geral

Este é o backend do **Launchcloud Klass**, um sistema simples de gestão de sala de aula.
Ele foi construído utilizando **Node.js, TypeScript e Express**.

## Arquitetura: Clean Architecture

O projeto é estritamente baseado nos princípios da **Clean Architecture** para garantir isolamento e testabilidade.

A lógica deve ser dividida nas seguintes camadas (`src/`):

1. **`domain` (Entidades e Interfaces):**
   - O core da aplicação.
   - Contém as regras de negócio puras (Classes de Domínio).
   - Não conhece banco de dados, frameworks ou a web.
   - Define _interfaces_ (portas) para repositórios que a infraestrutura vai implementar.

2. **`application` (Casos de Uso):**
   - Orquestra o fluxo de dados.
   - Recebe dados externos (via DTOs), chama as entidades de domínio e pede para os repositórios (via interfaces) salvarem os dados.
   - Arquivos nomeados como: `CreateUserUseCase.ts`, `EnrollStudentUseCase.ts`.

3. **`infrastructure` (Infraestrutura / Frameworks):**
   - Implementa as _interfaces_ do `domain` (ex: `PostgresUserRepository`, `InMemoryClassRepository`).
   - Contém os controladores HTTP, rotas do Express, configurações de injeção de dependência e integrações externas.
   - Entradas de dados (HTTP/REST), roteadores e middlewares vivem aqui (`src/infrastructure/http`).

## Regras de Código (TypeScript)

- **Sempre utilize tipagem forte.** Evite `any`.
- Mantenha classes e funções coesas e focadas em uma única responsabilidade (SOLID).
- Interfaces que descrevem como o Banco de Dados deve se comportar ficam no `domain` (ex: `IUserRepository`).
- A implementação real fica na `infrastructure` (ex: `UserRepositoryImpl`). O `application` apenas consome a interface.

## Gerenciamento de Pacotes e Scripts

> ⚠️ **Atenção:**
> Este projeto utiliza estritamente o **Yarn** como gerenciador de pacotes. Não utilize o `npm`.

Scripts disponíveis no `package.json`:

- `yarn start`: Roda a versão compilada em prod.
- `yarn dev`: Inicia o servidor local com hot-reload (tsx).
- `yarn build`: Compila o TypeScript.
- `yarn lint`: Verifica erros de código (ESLint).
- `yarn format`: Formata arquivos com Prettier.
