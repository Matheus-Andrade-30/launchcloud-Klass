# Launchcloud Klass - Backend

Backend para sistema de gestão de sala de aula, estruturado com **Clean Architecture**, **Node.js**, **TypeScript** e **Express**.

## 🏛️ Arquitetura

O projeto segue os princípios da **Arquitetura Limpa**, garantindo que as regras de negócio sejam isoladas de frameworks e detalhes técnicos:

- **`src/domain`**: O coração do sistema. Contém Entidades e Interfaces de Repositórios. Independente de bibliotecas externas.
- **`src/application`**: Casos de Uso (Use Cases). Orquestra o fluxo de dados, comunicando-se com o domínio e as interfaces de infraestrutura.
- **`src/infrastructure`**: Camada externa. Contém implementações de banco de dados, controladores HTTP (Express), rotas e configurações.

## 🚀 Tecnologias

- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Servidor:** [Express](https://expressjs.com/)
- **Gerenciador de Pacotes:** [Yarn](https://yarnpkg.com/)
- **Qualidade:** [ESLint](https://eslint.org/) e [Prettier](https://prettier.io/)
- **Hooks:** [Husky](https://typicode.github.io/husky/) e [lint-staged](https://github.com/lint-staged/lint-staged)

## 🛠️ Como Começar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/)

### Instalação e Setup

1. Instale as dependências:

   ```bash
   yarn install
   ```

2. O Husky deve ser instalado automaticamente, mas se necessário:
   ```bash
   yarn prepare
   ```

### Scripts Disponíveis

- `yarn dev`: Inicia o servidor em modo de desenvolvimento com hot-reload.
- `yarn build`: Compila o código TypeScript para JavaScript na pasta `dist/`.
- `yarn start`: Executa o código compilado (necessário rodar build antes).
- `yarn lint`: Executa o linter para verificar padrões de código.
- `yarn format`: Formata o código automaticamente seguindo o Prettier.

## 🤝 IA Friendly

O projeto conta com arquivos de instruções para assistentes de IA (`.copilot-instructions.md` e `CLAUDE.md`), facilitando a manutenção e geração de código condizente com a arquitetura proposta.

## 📝 Licença

Este projeto está sob a licença [MIT](LICENSE).