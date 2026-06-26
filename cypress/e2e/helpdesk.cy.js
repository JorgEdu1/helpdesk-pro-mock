describe('HelpDesk Pro - Casos de Teste', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.window().then((win) => win.localStorage.clear());
  });

  it('CT001 - Cadastro de cliente com dados validos', () => {
    cy.visit('/cadastro');
    fillRegister('Maria Silva', 'maria@teste.com', '123456');
    cy.contains('button', 'Cadastrar').click();

    cy.contains('Cadastro realizado com sucesso').should('be.visible');
    cy.window().then((win) => {
      const users = readStorage(win, 'helpdesk_users');
      expect(users).to.deep.include({
        id: users.find((user) => user.email === 'maria@teste.com').id,
        name: 'Maria Silva',
        email: 'maria@teste.com',
        password: '123456',
        role: 'CLIENT',
      });
    });
  });

  it('CT002 - Cadastro utilizando e-mail ja cadastrado', () => {
    cy.visit('/cadastro');
    fillRegister('Maria Silva', 'cliente@teste.com', '123456');
    cy.contains('button', 'Cadastrar').click();

    cy.contains('E-mail ja cadastrado.').should('be.visible');
    cy.window().then((win) => {
      const users = readStorage(win, 'helpdesk_users');
      expect(users.filter((user) => user.email.toLowerCase() === 'cliente@teste.com')).to.have.length(1);
    });
  });

  it('CT003 - Cadastro com senha abaixo do tamanho minimo', () => {
    cy.visit('/cadastro');
    fillRegister('Maria Silva', 'maria@teste.com', '123');
    cy.contains('button', 'Cadastrar').click();

    cy.get('#register-password').then(($input) => {
      expect($input[0].checkValidity()).to.equal(false);
    });
    cy.window().then((win) => {
      const users = readStorage(win, 'helpdesk_users');
      expect(users.some((user) => user.email === 'maria@teste.com')).to.equal(false);
    });
  });

  it('CT004 - Cadastro com nome vazio', () => {
    cy.visit('/cadastro');
    cy.get('#register-email').type('maria@teste.com');
    cy.get('#register-password').type('123456');
    cy.contains('button', 'Cadastrar').click();

    cy.get('#name').then(($input) => {
      expect($input[0].checkValidity()).to.equal(false);
    });
    cy.window().then((win) => {
      const users = readStorage(win, 'helpdesk_users');
      expect(users.some((user) => user.email === 'maria@teste.com')).to.equal(false);
    });
  });

  it('CT005 - Login com credenciais validas', () => {
    login('cliente@teste.com', '123456');

    cy.contains('Dashboard do Cliente').should('be.visible');
    cy.window().then((win) => {
      expect(readStorage(win, 'helpdesk_session')).to.include({ userId: 1 });
      expect(win.localStorage.getItem('helpdesk_token')).to.be.a('string');
    });
  });

  it('CT006 - Login com senha incorreta', () => {
    cy.visit('/login');
    cy.get('#email').type('cliente@teste.com');
    cy.get('#password').type('654321');
    cy.contains('button', 'Entrar').click();

    cy.contains('E-mail ou senha invalidos').should('be.visible');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('helpdesk_session')).to.equal(null);
    });
  });

  it('CT007 - Login com usuario inexistente', () => {
    cy.visit('/login');
    cy.get('#email').type('naoexiste@teste.com');
    cy.get('#password').type('123456');
    cy.contains('button', 'Entrar').click();

    cy.contains('E-mail ou senha invalidos').should('be.visible');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('helpdesk_session')).to.equal(null);
    });
  });

  it('CT008 - Logout do sistema', () => {
    login('cliente@teste.com', '123456');
    cy.contains('button', 'Sair').click();

    cy.contains('Entrar no HelpDesk Pro').should('be.visible');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('helpdesk_session')).to.equal(null);
      expect(win.localStorage.getItem('helpdesk_token')).to.equal(null);
    });
  });

  it('CT009 - Criacao de chamado com dados validos', () => {
    seedApp([]);
    cy.visit('/chamados/novo');
    fillTicket('Erro de acesso', 'Nao consigo entrar no sistema', 'Media');
    cy.contains('button', 'Criar Ticket').click();

    cy.contains('Erro de acesso').should('be.visible');
    cy.contains('ABERTO - Media').should('be.visible');
    assertTicketStored({ title: 'Erro de acesso', description: 'Nao consigo entrar no sistema', priority: 'Media', status: 'ABERTO' });
  });

  it('CT010 - Criacao de chamado sem titulo', () => {
    seedApp([]);
    cy.visit('/chamados/novo');
    cy.get('#ticket-description').type('Descricao valida');
    cy.get('#ticket-priority').select('Media');
    cy.contains('button', 'Criar Ticket').click();

    cy.get('#ticket-title').then(($input) => {
      expect($input[0].checkValidity()).to.equal(false);
    });
    assertTicketCount(0);
  });

  it('CT011 - Criacao de chamado sem descricao', () => {
    seedApp([]);
    cy.visit('/chamados/novo');
    cy.get('#ticket-title').type('Erro de acesso');
    cy.get('#ticket-priority').select('Media');
    cy.contains('button', 'Criar Ticket').click();

    cy.get('#ticket-description').then(($input) => {
      expect($input[0].checkValidity()).to.equal(false);
    });
    assertTicketCount(0);
  });

  it('CT012 - Criacao de chamado com prioridade Alta', () => {
    seedApp([]);
    cy.visit('/chamados/novo');
    fillTicket('Sistema indisponivel', 'Erro critico', 'Alta');
    cy.contains('button', 'Criar Ticket').click();

    cy.contains('Sistema indisponivel').should('be.visible');
    cy.contains('ABERTO - Alta').should('be.visible');
    assertTicketStored({ title: 'Sistema indisponivel', priority: 'Alta' });
  });

  it('CT013 - Criacao de chamados consecutivos', () => {
    seedApp([]);
    createTicket('Primeiro chamado', 'Descricao do primeiro chamado', 'Media');
    createTicket('Segundo chamado', 'Descricao do segundo chamado', 'Alta');

    cy.visit('/chamados');
    cy.contains('Primeiro chamado').should('be.visible');
    cy.contains('Segundo chamado').should('be.visible');
    assertTicketCount(2);
  });

  it('CT014 - Visualizacao da lista de chamados', () => {
    seedApp([
      ticket({ id: 10, title: 'Chamado um', priority: 'Media' }),
      ticket({ id: 11, title: 'Chamado dois', priority: 'Alta' }),
      ticket({ id: 12, userId: 30, userName: 'Outro Cliente', title: 'Chamado de outro cliente', priority: 'Baixa' }),
    ]);
    cy.visit('/chamados');

    cy.contains('Chamado um').should('be.visible');
    cy.contains('Chamado dois').should('be.visible');
    cy.contains('Chamado de outro cliente').should('not.exist');
    cy.contains('Contador de chamados: 2').should('be.visible');
  });

  it('CT015 - Filtrar chamados por prioridade', () => {
    seedApp([
      ticket({ id: 10, title: 'Chamado medio', priority: 'Media' }),
      ticket({ id: 11, title: 'Chamado alto', priority: 'Alta' }),
      ticket({ id: 12, title: 'Chamado baixo', priority: 'Baixa' }),
    ]);
    cy.visit('/chamados');
    cy.get('#filter-priority').select('Media');

    cy.contains('Chamado medio').should('be.visible');
    cy.contains('Chamado alto').should('not.exist');
    cy.contains('Chamado baixo').should('not.exist');
  });

  it('CT016 - Visualizar detalhes de chamado', () => {
    seedApp([
      ticket({ id: 16, title: 'Detalhe do chamado', description: 'Descricao completa', priority: 'Alta', status: 'ABERTO' }),
    ]);
    cy.visit('/chamados');
    cy.contains('Detalhes').click();

    cy.contains('Ticket #16').should('be.visible');
    cy.contains('Detalhe do chamado').should('be.visible');
    cy.contains('Descricao completa').should('be.visible');
    cy.contains('Prioridade').should('be.visible');
    cy.contains('Alta').should('be.visible');
    cy.contains('Status').should('be.visible');
    cy.contains('ABERTO').should('be.visible');
  });

  it('CT017 - Alterar descricao de chamado', () => {
    seedApp([
      ticket({ id: 17, title: 'Chamado editavel', description: 'Descricao antiga' }),
    ]);
    cy.visit('/ticket/17');
    cy.get('#detail-description').clear().type('Nova descricao');
    cy.contains('button', 'Salvar').click();

    cy.contains('Nova descricao').should('be.visible');
    assertTicketStored({ id: 17, description: 'Nova descricao' });
  });

  it('CT018 - Acessar chamado diretamente pela URL', () => {
    seedApp([
      ticket({ id: 18, title: 'Chamado por URL', description: 'Aberto diretamente' }),
    ]);
    cy.visit('/ticket/18');

    cy.contains('Ticket #18').should('be.visible');
    cy.contains('Chamado por URL').should('be.visible');
    cy.contains('Aberto diretamente').should('be.visible');
  });

  it('CT019 - Visualizacao da fila global de chamados', () => {
    seedApp([
      ticket({ id: 19, title: 'Chamado do cliente logado', priority: 'Media' }),
      ticket({ id: 190, userId: 30, userName: 'Outro Cliente', title: 'Chamado de outro cliente', priority: 'Alta' }),
    ], 2);
    cy.visit('/fila');

    cy.contains('Fila Global').should('be.visible');
    cy.contains('Chamado do cliente logado').should('be.visible');
    cy.contains('Chamado de outro cliente').should('be.visible');
  });

  it('CT020 - Assumir chamado aberto', () => {
    seedApp([ticket({ id: 20, title: 'Servidor sem rede', priority: 'Alta' })], 2);
    cy.visit('/ticket/20');
    cy.contains('button', 'Assumir atendimento').click();

    cy.contains('EM PROGRESSO').should('be.visible');
    cy.contains('Analista Teste').should('be.visible');
    assertTicketStored({ id: 20, status: 'EM PROGRESSO', assignedTo: 2, assignedToName: 'Analista Teste' });
  });

  it('CT021 - Tentar assumir chamado ja atribuido', () => {
    seedApp([
      ticket({ id: 21, title: 'Chamado ja atribuido', status: 'EM PROGRESSO', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ], 2);
    cy.visit('/ticket/21');

    cy.contains('button', 'Assumir atendimento').should('not.exist');
    cy.contains('EM PROGRESSO').should('be.visible');
    cy.contains('Analista Teste').should('be.visible');
    assertTicketStored({ id: 21, status: 'EM PROGRESSO', assignedTo: 2 });
  });

  it('CT022 - Resolver chamado assumido', () => {
    seedApp([
      ticket({ id: 22, title: 'Chamado assumido', status: 'EM PROGRESSO', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ], 2);
    cy.visit('/ticket/22');
    cy.contains('button', 'Marcar como resolvido').click();

    cy.contains('RESOLVIDO').should('be.visible');
    assertTicketStored({ id: 22, status: 'RESOLVIDO' });
  });

  it('CT023 - Cliente aprovar solucao e fechar chamado', () => {
    seedApp([
      ticket({ id: 23, title: 'Chamado resolvido', status: 'RESOLVIDO', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ]);
    cy.visit('/ticket/23');
    cy.contains('button', 'Aprovar e fechar').click();

    cy.contains('FECHADO').should('be.visible');
    cy.contains('Ticket fechado: apenas leitura.').should('be.visible');
    assertTicketStored({ id: 23, status: 'FECHADO' });
  });

  it('CT024 - Cliente rejeitar solucao e reabrir chamado', () => {
    seedApp([
      ticket({ id: 24, title: 'Chamado para reabrir', status: 'RESOLVIDO', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ]);
    cy.visit('/ticket/24');
    cy.contains('button', 'Rejeitar solucao').click();

    cy.contains('ABERTO').should('be.visible');
    assertTicketStored({ id: 24, status: 'ABERTO' });
  });

  it('CT025 - Adicionar comentario como cliente', () => {
    seedApp([
      ticket({ id: 25, title: 'Chamado com comentario do cliente', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ]);
    cy.visit('/ticket/25');
    cy.get('#comment').type('Preciso de ajuda com este problema');
    cy.contains('button', 'Adicionar comentario').click();

    cy.contains('Preciso de ajuda com este problema').should('be.visible');
    assertTicketComment(25, 'Preciso de ajuda com este problema', 1);
  });

  it('CT026 - Adicionar comentario como analista', () => {
    seedApp([
      ticket({ id: 26, title: 'Chamado com comentario do analista', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ], 2);
    cy.visit('/ticket/26');
    cy.get('#comment').type('Estamos analisando o problema');
    cy.contains('button', 'Adicionar comentario').click();

    cy.contains('Estamos analisando o problema').should('be.visible');
    assertTicketComment(26, 'Estamos analisando o problema', 2);
  });

  it('CT027 - Receber notificacao apos comentario', () => {
    seedApp([
      ticket({ id: 27, title: 'Chamado com notificacao ao analista', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ]);
    cy.visit('/ticket/27');
    cy.get('#comment').type('Comentario valido');
    cy.contains('button', 'Adicionar comentario').click();

    cy.window().then((win) => {
      win.localStorage.setItem('helpdesk_session', JSON.stringify({ userId: 2, startedAt: new Date().toISOString() }));
      win.localStorage.setItem('helpdesk_token', 'mock-token-2');
    });
    cy.visit('/notificacoes');
    cy.contains('COMENTARIO').should('be.visible');
    cy.contains('Novo comentario no chamado Chamado com notificacao ao analista.').should('be.visible');
  });

  it('CT028 - Receber notificacao apos mudanca de status', () => {
    seedApp([
      ticket({ id: 28, title: 'Chamado com notificacao ao cliente', status: 'EM PROGRESSO', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ], 2);
    cy.visit('/ticket/28');
    cy.contains('button', 'Marcar como resolvido').click();

    cy.window().then((win) => {
      win.localStorage.setItem('helpdesk_session', JSON.stringify({ userId: 1, startedAt: new Date().toISOString() }));
      win.localStorage.setItem('helpdesk_token', 'mock-token-1');
    });
    cy.visit('/notificacoes');
    cy.contains('STATUS').should('be.visible');
    cy.contains('Chamado Chamado com notificacao ao cliente marcado como resolvido.').should('be.visible');
  });
});

function fillRegister(name, email, password) {
  if (name) cy.get('#name').type(name);
  if (email) cy.get('#register-email').type(email);
  if (password) cy.get('#register-password').type(password);
}

function fillTicket(title, description, priority) {
  if (title) cy.get('#ticket-title').type(title);
  if (description) cy.get('#ticket-description').type(description);
  cy.get('#ticket-priority').select(priority);
}

function login(email, password) {
  cy.visit('/login');
  cy.get('#email').type(email);
  cy.get('#password').type(password);
  cy.contains('button', 'Entrar').click();
}

function createTicket(title, description, priority) {
  cy.visit('/chamados/novo');
  fillTicket(title, description, priority);
  cy.contains('button', 'Criar Ticket').click();
  cy.contains(title).should('be.visible');
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
    win.localStorage.removeItem('helpdesk_priority_filter');
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

function readStorage(win, key) {
  return JSON.parse(win.localStorage.getItem(key) || '[]');
}

function assertTicketCount(expectedCount) {
  cy.window().then((win) => {
    expect(readStorage(win, 'helpdesk_tickets')).to.have.length(expectedCount);
  });
}

function assertTicketStored(expected) {
  cy.window().then((win) => {
    const tickets = readStorage(win, 'helpdesk_tickets');
    const found = expected.id
      ? tickets.find((item) => item.id === expected.id)
      : tickets.find((item) => item.title === expected.title);

    expect(found, `ticket ${expected.id || expected.title}`).to.exist;
    Object.entries(expected).forEach(([key, value]) => {
      expect(found[key]).to.equal(value);
    });
  });
}

function assertTicketComment(ticketId, text, authorId) {
  cy.window().then((win) => {
    const tickets = readStorage(win, 'helpdesk_tickets');
    const found = tickets.find((item) => item.id === ticketId);
    expect(found).to.exist;
    expect(found.comments).to.deep.include({
      id: found.comments.find((item) => item.text === text).id,
      authorId,
      authorName: authorId === 1 ? 'Cliente Teste' : 'Analista Teste',
      authorRole: authorId === 1 ? 'CLIENT' : 'ANALYST',
      text,
      createdAt: found.comments.find((item) => item.text === text).createdAt,
    });
  });
}
