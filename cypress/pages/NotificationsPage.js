export class NotificationsPage {
  visit() {
    cy.visit('/notificacoes');
  }

  assertType(type) {
    cy.contains(type).should('be.visible');
  }

  assertMessage(message) {
    cy.contains(message).should('be.visible');
  }
}

export const notificationsPage = new NotificationsPage();
