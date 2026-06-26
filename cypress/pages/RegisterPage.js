export class RegisterPage {
  visit() {
    cy.visit('/cadastro');
  }

  fillName(name) {
    if (name) cy.get('#name').type(name);
  }

  fillEmail(email) {
    if (email) cy.get('#register-email').type(email);
  }

  fillPassword(password) {
    if (password) cy.get('#register-password').type(password);
  }

  fillForm(name, email, password) {
    this.fillName(name);
    this.fillEmail(email);
    this.fillPassword(password);
  }

  submit() {
    cy.contains('button', 'Cadastrar').click();
  }

  assertSuccessMessage() {
    cy.contains('Cadastro realizado com sucesso').should('be.visible');
  }

  assertDuplicatedEmailError() {
    cy.contains('E-mail ja cadastrado.').should('be.visible');
  }

  assertPasswordInvalid() {
    cy.get('#register-password').then(($input) => {
      expect($input[0].checkValidity()).to.equal(false);
    });
  }

  assertNameInvalid() {
    cy.get('#name').then(($input) => {
      expect($input[0].checkValidity()).to.equal(false);
    });
  }
}

export const registerPage = new RegisterPage();
