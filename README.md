# HelpDesk Pro Mock

Protótipo acadêmico em React + Vite para atividades de Verificação e Validação de Software. A aplicação simula um help desk com cadastro de clientes, autenticação, abertura e acompanhamento de chamados, fila global de analista, comentários, atribuição de atendimento, resolução, fechamento e notificações internas.

O projeto não usa backend nem banco de dados real. Todos os dados são persistidos no `localStorage` do navegador.

## Tecnologias

- React
- Vite
- JavaScript
- CSS
- localStorage
- Cypress

## Como instalar

```bash
npm install
```

## Como executar

```bash
npm run dev
```

Acesse a URL exibida pelo Vite. Normalmente:

```text
http://localhost:5173
```

## Usuários mockados

Cliente:

```text
E-mail: cliente@teste.com
Senha: 123456
```

Analista:

```text
E-mail: analista@teste.com
Senha: 123456
```

## Como rodar Cypress

Com o servidor de desenvolvimento em execução:

```bash
npx cypress open
```

A suíte automatizada possui cenários para cadastro, login de cliente, login de analista, criação e listagem de tickets, atribuição de atendimento e fechamento pelo cliente.
