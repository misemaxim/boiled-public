import { PluginTypes } from '../../src/types';
import { defaults } from './lib/defaults';
import { loginUser } from './lib/login-user';
import { mapping } from './lib/mapping';

describe('Session Editing', () => {
  const pointToDeleteCoordinates = [-118.360343, 34.091474] as [number, number];
  const pointToDeleteName = 'Orange Grove Lot';
  const pointToEditCoordinates = [-118.380405, 34.076826] as [number, number];
  const pointToEditNewCoordinates = [-118.366207, 34.083797] as [number, number];
  const pointToEditName = 'Bonner Lot';
  const pointToEditNewName = 'Unknown Space';

  beforeEach(() => {
    loginUser('boiled', 'password');
    mapping.openSession('Dev Session');
  });

  it('should load existing session data', () => {
    cy.log('Verifying Loaded Groups');
    mapping.openGroups();
    mapping.verifyGroup('Parking Spaces', 15);

    cy.log('Verifying Deleted Point');
    mapping.openGroup('Parking Spaces');
    mapping.openPointInfoFromTable(pointToDeleteName);
    mapping.verifyPointInfo(pointToDeleteName);
    mapping.closePointInfo();
    mapping.navigatePointFromTable(pointToDeleteName);
    mapping.centerClick();
    mapping.verifyPointInfo(pointToDeleteName);
    mapping.deletePoint(pointToDeleteName);
    mapping.goToCoordinates(pointToDeleteCoordinates);
    mapping.centerClick();
    mapping.verifyNoPointInfo();
    mapping.openGroups();
    mapping.verifyGroup('Parking Spaces', 14);

    cy.log('Verifying Edited Point');
    mapping.openGroup('Parking Spaces');
    mapping.openPointInfoFromTable(pointToEditName);
    mapping.verifyPointInfo(pointToEditName);
    mapping.closePointInfo();
    mapping.navigatePointFromTable(pointToEditName);
    mapping.centerClick();
    mapping.verifyPointInfo(pointToEditName);
    mapping.editPoint({
      coordinates: pointToEditNewCoordinates,
      name: pointToEditNewName,
      properties: [
        '(323) 000-0000',
        '0',
        'TBA'
      ]
    });
    mapping.goToCoordinates(pointToEditCoordinates);
    mapping.centerClick();
    mapping.verifyNoPointInfo();
    mapping.goToCoordinates(pointToEditNewCoordinates);
    mapping.centerClick();
    mapping.verifyPointInfo(pointToEditNewName);
    mapping.closePointInfo();
    mapping.openGroups();
    mapping.openGroup('Parking Spaces');
    mapping.openPointInfoFromTable(pointToEditNewName);
    mapping.verifyPointInfo(pointToEditNewName);
    mapping.verifyPointInfo('(323) 000-0000');
    mapping.verifyPointInfo('0');
    mapping.verifyPointInfo('TBA');
    mapping.closePointInfo();
    mapping.closeGroupPoints();
    mapping.saveCurrentSession();

    mapping.startNewSession();
    mapping.openSession('Dev Session');

    mapping.goToCoordinates(pointToEditNewCoordinates);
    mapping.centerClick();
    mapping.verifyPointInfo(pointToEditNewName);
    mapping.closePointInfo();

    cy.log('Verifying Plugin Toggling');
    mapping.refreshMap();
    defaults.verifyModalInfo('Found Filming Activity at N Fairfax Ave. / Romaine Str.:');
    defaults.closeModalInfo();
    mapping.togglePlugin(PluginTypes.Refresh, 'Filming Activity at N Fairfax Ave. / Romaine Str.');
    mapping.refreshMap();
    defaults.verifyNoOpenModal();
    mapping.saveCurrentSession();

    mapping.startNewSession();
    mapping.openSession('Dev Session');
    mapping.refreshMap();
    defaults.verifyNoOpenModal();
  });
});
