describe('HelpDesk Pro', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.clear();
    });
  });

  it('Cadastro válido', () => {
    cy.visit('/cadastro');
    cy.get('#name').type('Maria Cliente');
    cy.get('#register-email').type('maria@teste.com');
    cy.get('#register-password').type('123456');
    cy.contains('button', 'Cadastrar').click();
    cy.contains('Cadastro realizado com sucesso.').should('be.visible');
  });

  it('Login válido', () => {
    cy.visit('/login');
    cy.get('#email').type('cliente@teste.com');
    cy.get('#password').type('123456');
    cy.contains('button', 'Entrar').click();
    cy.contains('Dashboard do Cliente').should('be.visible');
  });

  it('Criação de Ticket', () => {
    seedSessionWithTickets([
      { id: 20, userId: 1, userName: 'Cliente Teste', title: 'Chamado antigo', description: 'Teste', priority: 'Baixa', status: 'ABERTO', createdAt: new Date().toISOString() },
    ]);
    login();
    cy.contains('Novo Chamado').click();
    cy.get('#ticket-title').type('Notebook sem acesso ao sistema');
    cy.get('#ticket-description').type('Usuário não consegue acessar o HelpDesk Pro.');
    cy.get('#ticket-priority').select('Média');
    cy.contains('button', 'Criar Ticket').click();
    cy.contains('Notebook sem acesso ao sistema').should('be.visible');
  });

  it('Filtragem de Tickets', () => {
    seedSessionWithTickets([
      { id: 10, userId: 1, userName: 'Cliente Teste', title: 'Chamado baixo', description: 'Teste', priority: 'Baixa', status: 'ABERTO', createdAt: new Date().toISOString() },
      { id: 11, userId: 1, userName: 'Cliente Teste', title: 'Chamado médio', description: 'Teste', priority: 'Média', status: 'ABERTO', createdAt: new Date().toISOString() },
      { id: 12, userId: 1, userName: 'Cliente Teste', title: 'Chamado médio extra', description: 'Teste', priority: 'Média', status: 'ABERTO', createdAt: new Date().toISOString() },
    ]);
    cy.visit('/chamados');
    cy.get('#filter-priority').select('Média');
    cy.contains('button', 'Anterior').click();
    cy.contains('Chamado médio').should('be.visible');
  });

  it('Logout', () => {
    login();
    cy.contains('button', 'Sair').click();
    cy.contains('Entrar no HelpDesk Pro').should('be.visible');
  });
});

function login() {
  cy.visit('/login');
  cy.get('#email').type('cliente@teste.com');
  cy.get('#password').type('123456');
  cy.contains('button', 'Entrar').click();
}

function seedSessionWithTickets(tickets) {
  cy.window().then((win) => {
    win.localStorage.setItem('helpdesk_users', JSON.stringify([
      { id: 1, name: 'Cliente Teste', email: 'cliente@teste.com', password: '123456', role: 'CLIENT' },
    ]));
    win.localStorage.setItem('helpdesk_session', JSON.stringify({ userId: 1, startedAt: new Date().toISOString() }));
    win.localStorage.setItem('helpdesk_tickets', JSON.stringify(tickets));
  });
}
