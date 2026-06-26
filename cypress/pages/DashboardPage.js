export class DashboardPage {
  assertClientDashboard() {
    cy.contains('Dashboard do Cliente').should('be.visible');
  }

  assertAnalystDashboard() {
    cy.contains('Dashboard do Analista').should('be.visible');
    cy.contains('Fila de atendimento').should('be.visible');
  }

  assertOpenTicketAction() {
    cy.contains('Abrir chamado').should('be.visible');
  }

  logout() {
    cy.contains('button', 'Sair').click();
  }
}

export const dashboardPage = new DashboardPage();
