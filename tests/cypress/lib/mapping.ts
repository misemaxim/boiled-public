import { kebabCase } from 'lodash';
import { PluginTypes } from '../../../src/types';
import { defaults } from './defaults';

export const mapping = {
  startNewSession: () => {
    cy.get('div.interface-primary-navigation a[data-test="start-new"]').click();
    cy.wait(2000);
  },
  openSession: (name: string) => {
    cy.get('div.interface-primary-navigation a[data-test="sessions-manager"]').click();
    cy.get(`div.boiled-sessions-table [data-test="data-row-${kebabCase(name)}"]`).click();
    mapping.waitForSession(name);
  },
  waitForSession: (name: string) => {
    cy.get('div.interface-primary-navigation.storage').contains(name, { timeout: 5000 });
  },
  waitForSavedSession: () => {
    defaults.verifyNotification('Current Session Is Saved');
  },
  saveNewSession: (name: string) => {
    cy.get('div.interface-primary-navigation a[data-test="save"]').click();
    cy.get('div.modal.open input[data-test="input-name"]').type(name);
    cy.get('div.modal.open div.modal-footer').find('a').click();
    mapping.waitForSavedSession();
  },
  saveCurrentSession: () => {
    cy.get('div.interface-primary-navigation span[data-test="save"]')
      .click()
      .then(trigger => {
        const targetId = trigger.attr('data-target');
        cy.get(`ul#${targetId} a[data-test="save"]`).click();
      });
    mapping.waitForSavedSession();
  },
  openGroups: () => {
    cy.get('div.interface-primary-navigation a[data-test="map-groups"]').click();
  },
  createGroup: (group: {
    name: string;
    icon: string;
    properties: string[];
  }) => {
    cy.get('div[data-test="map-groups"] div.interface-side-panel-action a').click();
    cy.get('div[data-test="group-form"] input[data-test="input-name"]').type(group.name);
    cy.get('div[data-test="group-form"] input[data-test="input-icon-search"]').type(group.icon);
    cy.get(`div[data-test="group-form"] img[data-name="${group.icon}"]`).click();
    group.properties.forEach(propertyName => {
      cy.get('div[data-test="group-form"] a[data-test="add-group-property"]').click();
      cy.get('div[data-test="group-form"] input[data-test="input-property"]').last().clear().type(propertyName);
    });
    cy.get('div[data-test="group-form"] div.interface-side-panel-action a').click();
  },
  createPoint: (point: {
    coordinates: [number, number];
    name: string;
    properties: string[];
    group: {
      name: string;
      icon: string;
      properties: string[];
    }
  }) => {
    mapping.goToCoordinates(point.coordinates);
    mapping.waitForAnimation();
    mapping.centerContextClick();
    cy.get('div.boiled-context-menu a[data-test="context-new-point"]').click();
    cy.get(`div[data-test="point-form"] input[data-test="input-group-${kebabCase(point.group.name)}"]`)
      .closest('label').click();
    cy.get('div[data-test="point-form"] input[data-test="input-name"]').type(point.name);
    point.properties.forEach((property, index) => {
      const propName = point.group.properties[index];
      cy.get(`div[data-test="point-form"] input[data-test="input-property-${propName}"]`).type(property);
    });
    cy.get('div[data-test="point-form"] div.interface-side-panel-action a').click();
  },
  editPoint: (point: {
    coordinates: [number, number];
    name: string;
    properties: string[];
  }) => {
    cy.get('div.modal.open span[data-test="boiled-overlay-actions"]')
      .click()
      .then(trigger => {
        const triggerId = trigger.attr('data-target');
        cy.get(`ul#${triggerId} a[data-test="edit"]`).click();
      });

    cy.get('div[data-test="point-form"] input[data-test="input-lon"]').clear().type(point.coordinates[0].toString());
    cy.get('div[data-test="point-form"] input[data-test="input-lat"]').clear().type(point.coordinates[1].toString());
    cy.get('div[data-test="point-form"] input[data-test="input-name"]').clear().type(point.name);

    point.properties.forEach((property, index) => {
      cy.get('div[data-test="point-form"] input[data-test*="input-property"]').eq(index).clear().type(property);
    });

    cy.get('div[data-test="point-form"] div.interface-side-panel-action a').click();
  },
  openGroup: (name: string) => {
    cy.get(`div[data-test="map-groups"] [data-test*="data-row-${kebabCase(name)}"]`).click();
  },
  verifyGroup: (name: string, count: number) => {
    cy.get(`div[data-test="map-groups"] [data-test="data-row-${kebabCase(name)}-${count}"]`).should('exist');
  },
  closeGroupPoints: () => {
    cy.get('div[data-test="points-table"] a.sidenav-close').click();
  },
  closeGroups: () => {
    cy.get('div[data-test="map-groups"] a.sidenav-close').click();
  },
  navigatePointFromTable: (name: string) => {
    cy.get(`div[data-test="points-table"] [data-test="data-row-${kebabCase(name)}"]`).click();
    mapping.waitForAnimation();
  },
  openPointInfoFromTable: (name: string) => {
    cy.get(`div[data-test="points-table"] [data-test="data-row-${kebabCase(name)}"]`)
      .find('a img[data-name="info-circle"]').click();
  },
  waitForAnimation: () => {
    cy.wait(1000);
  },
  zoomIn: (times = 1) => {
    for (let i = 0; i < times; i++) {
      cy.get('div.interface-primary-navigation a[data-test="zoom-in"]').click();
    }
  },
  centerClick: () => {
    cy.get('div#boiled-map-container').click('center');
  },
  centerContextClick: () => {
    cy.get('div#boiled-map-container').rightclick('center');
  },
  verifyPointInfo: (data: string) => {
    cy.get('div.boiled-point-info').contains(data);
  },
  verifyNoPointInfo: () => {
    cy.get('div.boiled-point-info').should('not.be.visible');
  },
  closePointInfo: () => {
    cy.get('div.boiled-point-info').closest('div.modal.open').find('a.sidenav-close').click();
  },
  searchPluginInvocation: (pluginName: string, query: string) => {
    cy.get('div.interface-primary-navigation span[data-test="search"]')
      .click()
      .then(trigger => {
        const targetId = trigger.attr('data-target');
        cy.get(`ul#${targetId} a[data-test="${kebabCase(pluginName)}"]`).click();
        cy.get('div.modal.open input[data-test="input-query"]').type(query);
        cy.get('div.modal.open div.modal-footer').find('a').click();
      });
  },
  goToCoordinates: ([lon, lat]: [number, number]) => {
    cy.get('div.interface-primary-navigation a[data-test="go-to-coordinates"]').click();
    cy.get('div.modal.open input[data-test="input-lon"]').type(lon.toString());
    cy.get('div.modal.open input[data-test="input-lat"]').type(lat.toString());
    cy.get('div.modal.open div.modal-footer').find('a').click();
    mapping.waitForAnimation();
  },
  contextPluginInvocation: (pluginName: string) => {
    cy.get('div.boiled-context-menu span[data-test="context-plugins"]')
      .click()
      .then(trigger => {
        const targetId = trigger.attr('data-target');
        cy.get(`ul#${targetId} a[data-test="${kebabCase(pluginName)}"]`).click();
      });
  },
  refreshMap: () => {
    cy.get('div.interface-primary-navigation a[data-test="refresh"]').click();
    cy.wait(1000);
  },
  deletePoint: (name: string) => {
    cy.get('div.modal.open span[data-test="boiled-overlay-actions"]')
      .click()
      .then(trigger => {
        const triggerId = trigger.attr('data-target');
        cy.get(`ul#${triggerId} a[data-test="delete"]`).click();
      });

    cy.get('div.modal.open').contains(`Do you want to delete the following point: "${name}"?`);
    cy.get('div.modal.open div.modal-footer').find('a').click();
  },
  pointPluginInvocation: (pluginName: string) => {
    cy.get('div.modal.open span[data-test="boiled-overlay-actions"]')
      .click()
      .then(trigger => {
        const triggerId = trigger.attr('data-target');
        cy.get(`ul#${triggerId} span[data-test="plugins"]`)
          .click()
          .then(pluginTrigger => {
            const pluginTriggerId = pluginTrigger.closest('span.interface-dropdown').attr('data-target');
            cy.get(`ul#${pluginTriggerId} a[data-test="${kebabCase(pluginName)}"]`).click();
          });
      });
  },
  togglePlugin: (type: PluginTypes, name: string) => {
    cy.get('div.interface-secondary-navigation span[data-test="plugins"]')
      .click()
      .then(trigger => {
        const targetId = trigger.attr('data-target');
        cy.get(`ul#${targetId} a[data-test="${type}"]`).click();

        cy.get(`div.modal.open [data-test="data-row-${kebabCase(name)}"]`).click();
        cy.get('div.modal.open div.modal-footer').find('a').click();
      });
  }
};
