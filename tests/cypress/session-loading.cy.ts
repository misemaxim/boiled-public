import { defaults } from './lib/defaults';
import { loginUser } from './lib/login-user';
import { mapping } from './lib/mapping';

describe('Session Loading', () => {
  beforeEach(() => {
    loginUser('boiled', 'password');
    mapping.openSession('Dev Session');
  });

  it('should load existing session data', () => {
    cy.log('Verifying Loaded Groups');
    mapping.openGroups();
    mapping.verifyGroup('Filming Activity', 48);
    mapping.verifyGroup('Parking Spaces', 15);

    cy.log('Verifying Applied Point Data - 1');
    mapping.openGroup('Parking Spaces');
    cy.log('Verifying Applied Point Data - 2 - In Table');
    mapping.openPointInfoFromTable('Hart Park');
    mapping.verifyPointInfo('Parking Spaces');
    mapping.verifyPointInfo('Hart Park');
    mapping.verifyPointInfo('8341 De Longpre Ave West');
    mapping.closePointInfo();
    cy.log('Verifying Applied Point Data - 2 - In Modal');
    mapping.navigatePointFromTable('Hart Park');
    mapping.waitForAnimation();
    mapping.zoomIn(3);
    mapping.centerClick();
    mapping.verifyPointInfo('Parking Spaces');
    mapping.verifyPointInfo('Hart Park');
    mapping.verifyPointInfo('8341 De Longpre Ave West');
    mapping.closePointInfo();

    cy.log('Verifying Applied Point Data - 2');
    mapping.openGroups();
    mapping.openGroup('Filming Activity');
    cy.log('Verifying Applied Point Data - 2 - In Table');
    mapping.openPointInfoFromTable('Big Boss');
    mapping.verifyPointInfo('Filming Activity');
    mapping.verifyPointInfo('Big Boss');
    mapping.verifyPointInfo('M-555071');
    mapping.closePointInfo();
    cy.log('Verifying Applied Point Data - 2 - In Modal');
    mapping.navigatePointFromTable('Big Boss');
    mapping.waitForAnimation();
    mapping.zoomIn(3);
    mapping.centerClick();
    mapping.verifyPointInfo('Filming Activity');
    mapping.verifyPointInfo('Big Boss');
    mapping.verifyPointInfo('M-555071');
    mapping.closePointInfo();

    cy.log('Verifying Search Plugin');
    mapping.searchPluginInvocation('Search For The Parking Space', 'Santa Monica Blvd');
    defaults.verifyModalInfo('Found Parking Lots:');
    defaults.verifyModalInfo('7377 Santa Monica Blvd West - 88 spaces');
    defaults.verifyModalInfo('8120 Santa Monica Blvd West - 63 spaces');
    defaults.verifyModalInfo('8383 Santa Monica Blvd West - 165 spaces');
    defaults.verifyModalInfo('7718 Santa Monica Blvd West - 28 spaces');
    defaults.closeModalInfo();

    cy.log('Verifying Coordinates Plugin');
    mapping.goToCoordinates([-118.371766, 34.090714]);
    mapping.centerContextClick();
    mapping.contextPluginInvocation('Filming Activity Nearby');
    defaults.verifyModalInfo('Found Music Video Filming Activity:');
    defaults.verifyModalInfo('8431 Santa Monica - Day 2 Productions LLC');
    defaults.verifyModalInfo('1235 N Kings Road #312 - Emily Williams / Southern California');
    defaults.verifyModalInfo('1108 Flores - Day 2 Productions LLC');
    defaults.verifyModalInfo('8430 Santa Monica Blvd - Day 2 Productions LLC');
    defaults.verifyModalInfo('8431 Santa Monica - Day 2 Productions LLC');
    defaults.verifyModalInfo('8289 Santa Monica Blvd - Jehan Productions LLC');
    defaults.closeModalInfo();

    cy.log('Verifying Refresh Plugin');
    mapping.refreshMap();
    defaults.verifyModalInfo('Found Filming Activity at N Fairfax Ave. / Romaine Str.:');
    defaults.verifyModalInfo('945 N Fairfax Ave - Crawford & Co Productions Inc');
    defaults.verifyModalInfo('944 N Hayworth #9 - Day One Perspective LLC');
    defaults.closeModalInfo();

    cy.log('Verifying Point Plugin');
    mapping.goToCoordinates([-118.350962, 34.090760]);
    mapping.centerClick();
    mapping.pointPluginInvocation('Filming Activity Near The Parking Space');
    defaults.verifyModalInfo('Found Filming Activity Near The Parking Space:');
    defaults.verifyModalInfo('Santa Monica Blvd & Poinsettia Place - 99 Pros');
    defaults.verifyModalInfo('7265 Santa Monica Blvd - Admilk LLC');
    defaults.closeModalInfo();
  });
});
