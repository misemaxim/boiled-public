import { kebabCase } from 'lodash';
import { ByPass, PluginTypes } from '../../../src/types';

export const plugins = {
  create: (plugin: {
    type: PluginTypes;
    script: string;
    name: string
  }) => {
    cy.get('div.interface-primary-navigation a[data-test="start-new"]').click();

    cy.get('div.interface-secondary-navigation span.interface-dropdown')
      .click()
      .then(trigger => {
        const targetId = trigger.attr('data-target');
        cy.get(`ul#${targetId} a[data-test="${plugin.type}"]`).click();
        cy.wait(1000);
      });

    cy.window().then(window => {
      const cm = (window.document.querySelector('.CodeMirror') as ByPass).CodeMirror;
      cm.setValue('');

      cy.get('div.CodeMirror textarea').type(plugin.script, { force: true });
      cy.get('div.interface-primary-navigation a[data-test="save"]').click();
      cy.get('div.modal.open input[data-test="input-name"]').type(plugin.name);
      cy.get('div.modal.open div.modal-footer').find('a').click();
      cy.wait(1000);
    });
  },
  evaluate: () => {
    cy.get('div.interface-secondary-navigation a[data-test="evaluate-plugin"]').click();
  },
  open: (name: string) => {
    cy.get('div.interface-primary-navigation a[data-test="plugins-manager"]').click();
    cy.get(`div[data-test="plugins-table"] div[data-test="data-row-${kebabCase(name)}"]`).click();
    cy.wait(1000);
  }
};
