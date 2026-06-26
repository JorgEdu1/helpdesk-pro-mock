import { dashboardPage } from '../pages/DashboardPage';
import { loginPage } from '../pages/LoginPage';
import { newTicketPage } from '../pages/NewTicketPage';
import { notificationsPage } from '../pages/NotificationsPage';
import { registerPage } from '../pages/RegisterPage';
import { ticketDetailsPage } from '../pages/TicketDetailsPage';
import { ticketListPage } from '../pages/TicketListPage';
import {
  assertDuplicatedEmailCount,
  assertNoSession,
  assertNoSessionOrToken,
  assertSessionCreated,
  assertTicketComment,
  assertTicketCount,
  assertTicketStored,
  assertUserNotStored,
  assertUserStored,
  clearAppStorage,
  seedApp,
  switchSession,
  ticket,
} from '../support/helpdeskData';

describe('HelpDesk Pro - Casos de Teste', () => {
  beforeEach(() => {
    clearAppStorage();
  });

  it('CT001 - Cadastro de cliente com dados validos', () => {
    registerPage.visit();
    registerPage.fillForm('Maria Silva', 'maria@teste.com', '123456');
    registerPage.submit();

    registerPage.assertSuccessMessage();
    assertUserStored('maria@teste.com', {
      name: 'Maria Silva',
      email: 'maria@teste.com',
      password: '123456',
      role: 'CLIENT',
    });
  });

  it('CT002 - Cadastro utilizando e-mail ja cadastrado', () => {
    registerPage.visit();
    registerPage.fillForm('Maria Silva', 'cliente@teste.com', '123456');
    registerPage.submit();

    registerPage.assertDuplicatedEmailError();
    assertDuplicatedEmailCount('cliente@teste.com', 1);
  });

  it('CT003 - Cadastro com senha abaixo do tamanho minimo', () => {
    registerPage.visit();
    registerPage.fillForm('Maria Silva', 'maria@teste.com', '123');
    registerPage.submit();

    registerPage.assertPasswordInvalid();
    assertUserNotStored('maria@teste.com');
  });

  it('CT004 - Cadastro com nome vazio', () => {
    registerPage.visit();
    registerPage.fillEmail('maria@teste.com');
    registerPage.fillPassword('123456');
    registerPage.submit();

    registerPage.assertNameInvalid();
    assertUserNotStored('maria@teste.com');
  });

  it('CT005 - Login com credenciais validas', () => {
    loginPage.login('cliente@teste.com', '123456');

    dashboardPage.assertClientDashboard();
    assertSessionCreated(1);
  });

  it('CT006 - Login com senha incorreta', () => {
    loginPage.visit();
    loginPage.fillEmail('cliente@teste.com');
    loginPage.fillPassword('654321');
    loginPage.submit();

    loginPage.assertAuthError();
    assertNoSession();
  });

  it('CT007 - Login com usuario inexistente', () => {
    loginPage.visit();
    loginPage.fillEmail('naoexiste@teste.com');
    loginPage.fillPassword('123456');
    loginPage.submit();

    loginPage.assertAuthError();
    assertNoSession();
  });

  it('CT008 - Logout do sistema', () => {
    loginPage.login('cliente@teste.com', '123456');
    dashboardPage.logout();

    loginPage.assertVisible();
    assertNoSessionOrToken();
  });

  it('CT009 - Criacao de chamado com dados validos', () => {
    seedApp([]);
    newTicketPage.create('Erro de acesso', 'Nao consigo entrar no sistema', 'Media');

    ticketListPage.assertTicketVisible('Erro de acesso');
    cy.contains('ABERTO - Media').should('be.visible');
    assertTicketStored({ title: 'Erro de acesso', description: 'Nao consigo entrar no sistema', priority: 'Media', status: 'ABERTO' });
  });

  it('CT010 - Criacao de chamado sem titulo', () => {
    seedApp([]);
    newTicketPage.visit();
    newTicketPage.fillDescription('Descricao valida');
    newTicketPage.selectPriority('Media');
    newTicketPage.submit();

    newTicketPage.assertTitleInvalid();
    assertTicketCount(0);
  });

  it('CT011 - Criacao de chamado sem descricao', () => {
    seedApp([]);
    newTicketPage.visit();
    newTicketPage.fillTitle('Erro de acesso');
    newTicketPage.selectPriority('Media');
    newTicketPage.submit();

    newTicketPage.assertDescriptionInvalid();
    assertTicketCount(0);
  });

  it('CT012 - Criacao de chamado com prioridade Alta', () => {
    seedApp([]);
    newTicketPage.create('Sistema indisponivel', 'Erro critico', 'Alta');

    ticketListPage.assertTicketVisible('Sistema indisponivel');
    cy.contains('ABERTO - Alta').should('be.visible');
    assertTicketStored({ title: 'Sistema indisponivel', priority: 'Alta' });
  });

  it('CT013 - Criacao de chamados consecutivos', () => {
    seedApp([]);
    newTicketPage.create('Primeiro chamado', 'Descricao do primeiro chamado', 'Media');
    ticketListPage.assertTicketVisible('Primeiro chamado');
    newTicketPage.create('Segundo chamado', 'Descricao do segundo chamado', 'Alta');

    ticketListPage.visit();
    ticketListPage.assertTicketVisible('Primeiro chamado');
    ticketListPage.assertTicketVisible('Segundo chamado');
    assertTicketCount(2);
  });

  it('CT014 - Visualizacao da lista de chamados', () => {
    seedApp([
      ticket({ id: 10, title: 'Chamado um', priority: 'Media' }),
      ticket({ id: 11, title: 'Chamado dois', priority: 'Alta' }),
      ticket({ id: 12, userId: 30, userName: 'Outro Cliente', title: 'Chamado de outro cliente', priority: 'Baixa' }),
    ]);
    ticketListPage.visit();

    ticketListPage.assertTicketVisible('Chamado um');
    ticketListPage.assertTicketVisible('Chamado dois');
    ticketListPage.assertTicketNotPresent('Chamado de outro cliente');
    ticketListPage.assertCounter(2);
  });

  it('CT015 - Filtrar chamados por prioridade', () => {
    seedApp([
      ticket({ id: 10, title: 'Chamado medio', priority: 'Media' }),
      ticket({ id: 11, title: 'Chamado alto', priority: 'Alta' }),
      ticket({ id: 12, title: 'Chamado baixo', priority: 'Baixa' }),
    ]);
    ticketListPage.visit();
    ticketListPage.filterByPriority('Media');

    ticketListPage.assertTicketVisible('Chamado medio');
    ticketListPage.assertTicketNotPresent('Chamado alto');
    ticketListPage.assertTicketNotPresent('Chamado baixo');
  });

  it('CT016 - Visualizar detalhes de chamado', () => {
    seedApp([
      ticket({ id: 16, title: 'Detalhe do chamado', description: 'Descricao completa', priority: 'Alta', status: 'ABERTO' }),
    ]);
    ticketListPage.visit();
    ticketListPage.openDetails();

    ticketDetailsPage.assertTicketHeader(16);
    ticketDetailsPage.assertTextVisible('Detalhe do chamado');
    ticketDetailsPage.assertTextVisible('Descricao completa');
    ticketDetailsPage.assertTextVisible('Prioridade');
    ticketDetailsPage.assertTextVisible('Alta');
    ticketDetailsPage.assertTextVisible('Status');
    ticketDetailsPage.assertStatus('ABERTO');
  });

  it('CT017 - Alterar descricao de chamado', () => {
    seedApp([
      ticket({ id: 17, title: 'Chamado editavel', description: 'Descricao antiga' }),
    ]);
    ticketDetailsPage.visit(17);
    ticketDetailsPage.changeDescription('Nova descricao');

    ticketDetailsPage.assertTextVisible('Nova descricao');
    assertTicketStored({ id: 17, description: 'Nova descricao' });
  });

  it('CT018 - Acessar chamado diretamente pela URL', () => {
    seedApp([
      ticket({ id: 18, title: 'Chamado por URL', description: 'Aberto diretamente' }),
    ]);
    ticketDetailsPage.visit(18);

    ticketDetailsPage.assertTicketHeader(18);
    ticketDetailsPage.assertTextVisible('Chamado por URL');
    ticketDetailsPage.assertTextVisible('Aberto diretamente');
  });

  it('CT019 - Visualizacao da fila global de chamados', () => {
    seedApp([
      ticket({ id: 19, title: 'Chamado do cliente logado', priority: 'Media' }),
      ticket({ id: 190, userId: 30, userName: 'Outro Cliente', title: 'Chamado de outro cliente', priority: 'Alta' }),
    ], 2);
    ticketListPage.visitGlobalQueue();

    ticketListPage.assertQueueVisible();
    ticketListPage.assertTicketVisible('Chamado do cliente logado');
    ticketListPage.assertTicketVisible('Chamado de outro cliente');
  });

  it('CT020 - Assumir chamado aberto', () => {
    seedApp([ticket({ id: 20, title: 'Servidor sem rede', priority: 'Alta' })], 2);
    ticketDetailsPage.visit(20);
    ticketDetailsPage.assumeTicket();

    ticketDetailsPage.assertStatus('EM PROGRESSO');
    ticketDetailsPage.assertTextVisible('Analista Teste');
    assertTicketStored({ id: 20, status: 'EM PROGRESSO', assignedTo: 2, assignedToName: 'Analista Teste' });
  });

  it('CT021 - Tentar assumir chamado ja atribuido', () => {
    seedApp([
      ticket({ id: 21, title: 'Chamado ja atribuido', status: 'EM PROGRESSO', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ], 2);
    ticketDetailsPage.visit(21);

    ticketDetailsPage.assertAssumeButtonNotPresent();
    ticketDetailsPage.assertStatus('EM PROGRESSO');
    ticketDetailsPage.assertTextVisible('Analista Teste');
    assertTicketStored({ id: 21, status: 'EM PROGRESSO', assignedTo: 2 });
  });

  it('CT022 - Resolver chamado assumido', () => {
    seedApp([
      ticket({ id: 22, title: 'Chamado assumido', status: 'EM PROGRESSO', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ], 2);
    ticketDetailsPage.visit(22);
    ticketDetailsPage.resolveTicket();

    ticketDetailsPage.assertStatus('RESOLVIDO');
    assertTicketStored({ id: 22, status: 'RESOLVIDO' });
  });

  it('CT023 - Cliente aprovar solucao e fechar chamado', () => {
    seedApp([
      ticket({ id: 23, title: 'Chamado resolvido', status: 'RESOLVIDO', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ]);
    ticketDetailsPage.visit(23);
    ticketDetailsPage.closeTicket();

    ticketDetailsPage.assertStatus('FECHADO');
    ticketDetailsPage.assertTextVisible('Ticket fechado: apenas leitura.');
    assertTicketStored({ id: 23, status: 'FECHADO' });
  });

  it('CT024 - Cliente rejeitar solucao e reabrir chamado', () => {
    seedApp([
      ticket({ id: 24, title: 'Chamado para reabrir', status: 'RESOLVIDO', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ]);
    ticketDetailsPage.visit(24);
    ticketDetailsPage.reopenTicket();

    ticketDetailsPage.assertStatus('ABERTO');
    assertTicketStored({ id: 24, status: 'ABERTO' });
  });

  it('CT025 - Adicionar comentario como cliente', () => {
    seedApp([
      ticket({ id: 25, title: 'Chamado com comentario do cliente', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ]);
    ticketDetailsPage.visit(25);
    ticketDetailsPage.addComment('Preciso de ajuda com este problema');

    ticketDetailsPage.assertTextVisible('Preciso de ajuda com este problema');
    assertTicketComment(25, 'Preciso de ajuda com este problema', 1);
  });

  it('CT026 - Adicionar comentario como analista', () => {
    seedApp([
      ticket({ id: 26, title: 'Chamado com comentario do analista', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ], 2);
    ticketDetailsPage.visit(26);
    ticketDetailsPage.addComment('Estamos analisando o problema');

    ticketDetailsPage.assertTextVisible('Estamos analisando o problema');
    assertTicketComment(26, 'Estamos analisando o problema', 2);
  });

  it('CT027 - Receber notificacao apos comentario', () => {
    seedApp([
      ticket({ id: 27, title: 'Chamado com notificacao ao analista', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ]);
    ticketDetailsPage.visit(27);
    ticketDetailsPage.addComment('Comentario valido');

    switchSession(2);
    notificationsPage.visit();
    notificationsPage.assertType('COMENTARIO');
    notificationsPage.assertMessage('Novo comentario no chamado Chamado com notificacao ao analista.');
  });

  it('CT028 - Receber notificacao apos mudanca de status', () => {
    seedApp([
      ticket({ id: 28, title: 'Chamado com notificacao ao cliente', status: 'EM PROGRESSO', assignedTo: 2, assignedToName: 'Analista Teste' }),
    ], 2);
    ticketDetailsPage.visit(28);
    ticketDetailsPage.resolveTicket();

    switchSession(1);
    notificationsPage.visit();
    notificationsPage.assertType('STATUS');
    notificationsPage.assertMessage('Chamado Chamado com notificacao ao cliente marcado como resolvido.');
  });
});
