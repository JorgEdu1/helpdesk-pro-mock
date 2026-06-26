export class TicketListPage {
  visit() {
    cy.visit('/chamados');
  }

  visitGlobalQueue() {
    cy.visit('/fila');
  }

  filterByPriority(priority) {
    cy.get('#filter-priority').select(priority);
  }

  openDetails() {
    cy.contains('Detalhes').click();
  }

  assertTicketVisible(title) {
    cy.contains(title).should('be.visible');
  }

  assertTicketNotPresent(title) {
    cy.contains(title).should('not.exist');
  }

  assertCounter(total) {
    cy.contains(`Contador de chamados: ${total}`).should('be.visible');
  }

  assertQueueVisible() {
    cy.contains('Fila Global').should('be.visible');
  }
}

export const ticketListPage = new TicketListPage();
