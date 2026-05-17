export const loginUser = (username: string, password: string) => {
  cy.visit('http://localhost:9000/login');
  cy.get('div.modal-content input[data-test="input-username"]').type(username);
  cy.get('div.modal-content input[data-test="input-password"]').type(password);
  cy.get('div.modal-footer a').click();
};
