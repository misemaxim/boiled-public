import axios from 'axios';

beforeEach(async () => {
  cy.log('Resetting Data Before The Test');
  await axios.get('/dev/api/storage-reset');
  await axios.get('/dev/api/storage-create');
});