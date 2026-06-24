describe('HelpDesk Pro', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.window().then((win) => win.localStorage.clear());
  });

  it('Cadastro valido', () => {
    cy.visit('/cadastro');
    cy.get('#name').type('Maria Cliente');
    cy.get('#register-email').type('maria@teste.com');
    cy.get('#register-password').type('123456');
    cy.contains('button', 'Cadastrar').click();
    cy.contains('Entrar no HelpDesk Pro').should('be.visible');
  });

  it('Cadastro com e-mail duplicado', () => {
    cy.visit('/cadastro');
    cy.get('#name').type('Cliente Duplicado');
    cy.get('#register-email').type('CLIENTE@TESTE.COM');
    cy.get('#register-password').type('123456');
    cy.contains('button', 'Cadastrar').click();
    cy.contains('E-mail ja cadastrado.').should('be.visible');
  });

  it('Login valido cliente', () => {
    login('cliente@teste.com', '123456');
    cy.contains('Dashboard do Cliente').should('be.visible');
    cy.contains('Abrir chamado').should('be.visible');
  });

  it('Login valido analista', () => {
    login('analista@teste.com', '123456');
    cy.contains('Dashboard do Analista').should('be.visible');
    cy.contains('Fila de atendimento').should('be.visible');
  });

  it('Criacao de ticket', () => {
    seedApp([]);
    cy.visit('/chamados/novo');
    cy.get('#ticket-title').type('Notebook sem acesso ao sistema');
    cy.get('#ticket-description').type('Usuario nao consegue acessar o HelpDesk Pro.');
    cy.get('#ticket-priority').select('Alta');
    cy.contains('button', 'Criar Ticket').click();
    cy.contains('Notebook sem acesso ao sistema').should('be.visible');
    cy.contains('ABERTO - Alta').should('be.visible');
  });

  it('Listagem de tickets do cliente', () => {
    seedApp([
      ticket({ id: 10, userId: 1, userName: 'Cliente Teste', title: 'Chamado do cliente logado', priority: 'Media' }),
      ticket({ id: 11, userId: 30, userName: 'Outro Cliente', title: 'Chamado de outro cliente', priority: 'Alta' }),
    ]);
    cy.visit('/chamados');
    cy.contains('Chamado do cliente logado').should('be.visible');
    cy.contains('Chamado de outro cliente').should('not.exist');
    cy.contains('Contador de chamados: 1').should('be.visible');
  });

  it('Analista assume ticket', () => {
    seedApp([ticket({ id: 20, title: 'Servidor sem rede', priority: 'Alta' })], 2);
    cy.visit('/fila');
    cy.contains('Servidor sem rede').click();
    cy.contains('button', 'Assumir atendimento').click();
    cy.contains('EM PROGRESSO').should('be.visible');
    cy.contains('Analista Teste').should('be.visible');
  });

  it('Cliente fecha ticket resolvido', () => {
    seedApp([
      ticket({
        id: 30,
        title: 'VPN instavel',
        status: 'RESOLVIDO',
        assignedTo: 2,
        assignedToName: 'Analista Teste',
      }),
    ]);
    cy.visit('/ticket/30');
    cy.contains('button', 'Aprovar e fechar').click();
    cy.contains('FECHADO').should('be.visible');
    cy.contains('Ticket fechado: apenas leitura.').should('be.visible');
  });
});

function login(email, password) {
  cy.visit('/login');
  cy.get('#email').type(email);
  cy.get('#password').type(password);
  cy.contains('button', 'Entrar').click();
}

function seedApp(tickets, sessionUserId = 1) {
  cy.visit('/login');
  cy.window().then((win) => {
    win.localStorage.setItem('helpdesk_users', JSON.stringify([
      { id: 1, name: 'Cliente Teste', email: 'cliente@teste.com', password: '123456', role: 'CLIENT' },
      { id: 2, name: 'Analista Teste', email: 'analista@teste.com', password: '123456', role: 'ANALYST' },
      { id: 30, name: 'Outro Cliente', email: 'outro@teste.com', password: '123456', role: 'CLIENT' },
    ]));
    win.localStorage.setItem('helpdesk_session', JSON.stringify({ userId: sessionUserId, startedAt: new Date().toISOString() }));
    win.localStorage.setItem('helpdesk_token', `mock-token-${sessionUserId}`);
    win.localStorage.setItem('helpdesk_tickets', JSON.stringify(tickets));
    win.localStorage.setItem('helpdesk_notifications', JSON.stringify([]));
  });
}

function ticket(overrides = {}) {
  return {
    id: 1,
    userId: 1,
    userName: 'Cliente Teste',
    title: 'Chamado de teste',
    description: 'Descricao do chamado de teste.',
    priority: 'Media',
    status: 'ABERTO',
    createdAt: new Date().toISOString(),
    assignedTo: null,
    assignedToName: '',
    comments: [],
    ...overrides,
  };
}
