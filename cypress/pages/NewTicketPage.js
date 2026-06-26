export class NewTicketPage {
  visit() {
    cy.visit('/chamados/novo');
  }

  fillTitle(title) {
    if (title) cy.get('#ticket-title').type(title);
  }

  fillDescription(description) {
    if (description) cy.get('#ticket-description').type(description);
  }

  selectPriority(priority) {
    cy.get('#ticket-priority').select(priority);
  }

  fillForm(title, description, priority) {
    this.fillTitle(title);
    this.fillDescription(description);
    this.selectPriority(priority);
  }

  submit() {
    cy.contains('button', 'Criar Ticket').click();
  }

  create(title, description, priority) {
    this.visit();
    this.fillForm(title, description, priority);
    this.submit();
  }

  assertTitleInvalid() {
    cy.get('#ticket-title').then(($input) => {
      expect($input[0].checkValidity()).to.equal(false);
    });
  }

  assertDescriptionInvalid() {
    cy.get('#ticket-description').then(($input) => {
      expect($input[0].checkValidity()).to.equal(false);
    });
  }
}

export const newTicketPage = new NewTicketPage();
