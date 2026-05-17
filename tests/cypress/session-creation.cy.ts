import { APP_MODULES, PluginTypes } from '../../src/types';
import { defaults } from './lib/defaults';
import { loginUser } from './lib/login-user';
import { mapping } from './lib/mapping';
import { plugins } from './lib/plguins';

describe('Session Creation', () => {
  const group = {
    name: 'Cherry Locations',
    icon: 'cherry',
    properties: ['state']
  };
  const point = {
    coordinates: [-123.061033, 45.122019] as [number, number],
    name: 'Oregon Cherry',
    properties: ['Oregon'],
    group
  };

  beforeEach(() => {
    loginUser('boiled', 'password');
    mapping.startNewSession();
  });

  it('should save and update created session', () => {
    cy.log('Verifying Created Group');
    mapping.openGroups();
    mapping.createGroup(group);
    mapping.openGroups();
    mapping.verifyGroup(group.name, 0);
    mapping.closeGroups();

    cy.log('Verifying Created Point');
    mapping.createPoint(point);
    mapping.goToCoordinates(point.coordinates);
    mapping.waitForAnimation();
    mapping.zoomIn(3);
    mapping.centerClick();
    mapping.verifyPointInfo(group.name);
    mapping.verifyPointInfo(point.name);
    mapping.verifyPointInfo(group.properties[0]);
    mapping.verifyPointInfo(point.properties[0]);
    mapping.closePointInfo();

    cy.log('Verifying Session Saving');
    mapping.saveNewSession('Cherries In America');
    mapping.startNewSession();
    mapping.openSession('Cherries In America');

    cy.log('Verifying Saved Group');
    mapping.openGroups();
    mapping.verifyGroup(group.name, 1);

    cy.log('Verifying Saved Point');
    mapping.openGroup(group.name);
    mapping.navigatePointFromTable(point.name);
    mapping.waitForAnimation();
    mapping.zoomIn(3);
    mapping.centerClick();
    mapping.verifyPointInfo(group.name);
    mapping.verifyPointInfo(point.name);
    mapping.verifyPointInfo(group.properties[0]);
    mapping.verifyPointInfo(point.properties[0]);
    mapping.closePointInfo();

    cy.log('Verifying Created Plugin');
    defaults.goToSection(APP_MODULES.PLUGINS);
    plugins.create({
      type: PluginTypes.Refresh,
      script: 'scope.notification("Executed From Cypress");',
      name: 'Refresh Test Plugin'
    });
    plugins.evaluate();
    defaults.verifyNotification('Executed From Cypress');
    cy.reload();
    plugins.open('Refresh Test Plugin');
    plugins.evaluate();
    defaults.verifyNotification('Executed From Cypress');

    cy.log('Verifying Usage Of Created Plugin');
    defaults.goToSection(APP_MODULES.MAP);
    cy.log(' - reload to clear existing notifications');
    cy.reload();
    mapping.waitForSession('Cherries In America');
    mapping.togglePlugin(PluginTypes.Refresh, 'Refresh Test Plugin');
    mapping.refreshMap();
    defaults.verifyNotification('Executed From Cypress');
    cy.log(' - reload to check plugins in temp session');
    cy.reload();
    mapping.waitForSession('Cherries In America');
    mapping.refreshMap();
    defaults.verifyNotification('Executed From Cypress');
    mapping.saveCurrentSession();
    cy.log(' - reload to check plugins in temp session');
    cy.reload();
    mapping.startNewSession();
    mapping.openSession('Cherries In America');
    mapping.refreshMap();
    defaults.verifyNotification('Executed From Cypress');
  });
});
