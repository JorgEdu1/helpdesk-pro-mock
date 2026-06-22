# HelpDesk Pro

Protótipo web acadêmico para atividades de Verificação e Validação. A aplicação implementa cadastro de cliente, login, dashboard, abertura de chamados, listagem com filtro/paginação e tela de detalhes do ticket.

## Tecnologias

- React
- Vite
- JavaScript
- CSS simples
- localStorage
- Cypress

## Como executar

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse a URL exibida pelo Vite, normalmente:

```text
http://localhost:5173
```

## Usuário mockado

```text
E-mail: cliente@teste.com
Senha: 123456
```

## Testes automatizados

Com o servidor de desenvolvimento em execução, abra o Cypress:

```bash
npx cypress open
```

O projeto possui 5 cenários automatizados:

- Cadastro válido
- Login válido
- Criação de Ticket
- Filtragem de Tickets
- Logout
