export class LoginPage {
  visit() {
    cy.visit('/login');
  }

  fillEmail(email) {
    cy.get('#email').type(email);
  }

  fillPassword(password) {
    cy.get('#password').type(password);
  }

  submit() {
    cy.contains('button', 'Entrar').click();
  }

  login(email, password) {
    this.visit();
    this.fillEmail(email);
    this.fillPassword(password);
    this.submit();
  }

  assertVisible() {
    cy.contains('Entrar no HelpDesk Pro').should('be.visible');
  }

  assertAuthError() {
    cy.contains('E-mail ou senha invalidos').should('be.visible');
  }
}

export const loginPage = new LoginPage();
