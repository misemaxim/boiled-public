import { APP_MODULES } from '../../../src/types';

export const defaults = {
  verifyModalInfo: (data: string) => {
    cy.get('div.modal.open').contains(data);
  },
  closeModalInfo: () => {
    cy.get('div.modal.open').find('a.sidenav-close').click();
  },
  verifyNoOpenModal: () => {
    cy.get('div.modal.open').should('not.exist');
  },
  goToSection: (section: APP_MODULES) => {
    cy.get('div.interface-primary-navigation span[data-test="navigation"]')
      .click()
      .then(trigger => {
        const targetId = trigger.attr('data-target');
        cy.get(`ul#${targetId} a[data-test="${section.toLowerCase().slice(1)}"]`).click();
        cy.wait(1000);
      });
  },
  verifyNotification: (message: string) => {
    cy.get('div#toast-container').contains(message);
  }
};
