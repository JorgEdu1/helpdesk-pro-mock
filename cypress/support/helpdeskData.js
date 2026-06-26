export function clearAppStorage() {
  cy.visit('/login');
  cy.window().then((win) => win.localStorage.clear());
}

export function seedApp(tickets, sessionUserId = 1) {
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

export function switchSession(userId) {
  cy.window().then((win) => {
    win.localStorage.setItem('helpdesk_session', JSON.stringify({ userId, startedAt: new Date().toISOString() }));
    win.localStorage.setItem('helpdesk_token', `mock-token-${userId}`);
  });
}

export function ticket(overrides = {}) {
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

export function readStorage(win, key) {
  return JSON.parse(win.localStorage.getItem(key) || '[]');
}

export function assertUserStored(expectedEmail, expectedUser) {
  cy.window().then((win) => {
    const users = readStorage(win, 'helpdesk_users');
    const found = users.find((user) => user.email === expectedEmail);
    expect(found, `user ${expectedEmail}`).to.exist;
    expect(found).to.deep.include(expectedUser);
  });
}

export function assertDuplicatedEmailCount(email, expectedCount) {
  cy.window().then((win) => {
    const users = readStorage(win, 'helpdesk_users');
    expect(users.filter((user) => user.email.toLowerCase() === email.toLowerCase())).to.have.length(expectedCount);
  });
}

export function assertUserNotStored(email) {
  cy.window().then((win) => {
    const users = readStorage(win, 'helpdesk_users');
    expect(users.some((user) => user.email === email)).to.equal(false);
  });
}

export function assertSessionCreated(userId) {
  cy.window().then((win) => {
    expect(readStorage(win, 'helpdesk_session')).to.include({ userId });
    expect(win.localStorage.getItem('helpdesk_token')).to.be.a('string');
  });
}

export function assertNoSession() {
  cy.window().then((win) => {
    expect(win.localStorage.getItem('helpdesk_session')).to.equal(null);
  });
}

export function assertNoSessionOrToken() {
  cy.window().then((win) => {
    expect(win.localStorage.getItem('helpdesk_session')).to.equal(null);
    expect(win.localStorage.getItem('helpdesk_token')).to.equal(null);
  });
}

export function assertTicketCount(expectedCount) {
  cy.window().then((win) => {
    expect(readStorage(win, 'helpdesk_tickets')).to.have.length(expectedCount);
  });
}

export function assertTicketStored(expected) {
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

export function assertTicketComment(ticketId, text, authorId) {
  cy.window().then((win) => {
    const tickets = readStorage(win, 'helpdesk_tickets');
    const found = tickets.find((item) => item.id === ticketId);
    const comment = found?.comments?.find((item) => item.text === text);

    expect(found).to.exist;
    expect(comment).to.exist;
    expect(comment).to.deep.include({
      authorId,
      authorName: authorId === 1 ? 'Cliente Teste' : 'Analista Teste',
      authorRole: authorId === 1 ? 'CLIENT' : 'ANALYST',
      text,
    });
  });
}
