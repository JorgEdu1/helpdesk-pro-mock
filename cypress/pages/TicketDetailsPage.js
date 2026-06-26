export class TicketDetailsPage {
  visit(id) {
    cy.visit(`/ticket/${id}`);
  }

  assumeTicket() {
    cy.contains('button', 'Assumir atendimento').click();
  }

  resolveTicket() {
    cy.contains('button', 'Marcar como resolvido').click();
  }

  closeTicket() {
    cy.contains('button', 'Aprovar e fechar').click();
  }

  reopenTicket() {
    cy.contains('button', 'Rejeitar solucao').click();
  }

  changeDescription(description) {
    cy.get('#detail-description').clear().type(description);
    cy.contains('button', 'Salvar').click();
  }

  addComment(comment) {
    cy.get('#comment').type(comment);
    cy.contains('button', 'Adicionar comentario').click();
  }

  assertTicketHeader(id) {
    cy.contains(`Ticket #${id}`).should('be.visible');
  }

  assertTextVisible(text) {
    cy.contains(text).should('be.visible');
  }

  assertStatus(status) {
    cy.contains(status).should('be.visible');
  }

  assertAssumeButtonNotPresent() {
    cy.contains('button', 'Assumir atendimento').should('not.exist');
  }
}

export const ticketDetailsPage = new TicketDetailsPage();
