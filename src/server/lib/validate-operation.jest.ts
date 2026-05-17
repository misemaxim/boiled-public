import { Request } from 'express';
import { USER_TYPES } from '../../types';
import { encryptionService } from './encryption-service';
import { serverStorage } from './server-storage';
import { validateOperation } from './validate-operation';

jest.mock('./validate-operation', () => ({
  ...jest.requireActual('./validate-operation')
}));

describe('validateOperation', () => {
  let cookieHeader = '';

  beforeEach(async () => {
    cookieHeader = [
      'abc=123',
      'cde=456',
      '_boiled_signature=' + encryptionService.encrypt(
        JSON.stringify({ username: [(Math.random() * 10000000000).toFixed(), 'someone'].join(':'), token: 'valid-token' })
      ),
      'def=789'
    ].join('; ');
  });

  test('should validate operation if cookie is up to date and valid', async () => {
    await serverStorage.users.create(USER_TYPES.ADMIN, 'someone', 'pass-123');
    const userData = (await serverStorage.users.get('someone'))!;
    await serverStorage.users.update('someone', {
      ...userData.data,
      cookie: {
        value: 'valid-token',
        maxAge: Date.now() + 24 * 60 * 60 * 1000
      }
    });

    const username = await validateOperation({
      headers: {
        cookie: cookieHeader
      }
    } as Request);
    expect(username).toBe('someone');
  });

  test('should not validate operation if cookie is up to date and valid but user is missing', async () => {
    const username = await validateOperation({
      headers: {
        cookie: cookieHeader
      }
    } as Request);
    expect(username).toBe(null);
  });

  test('should not validate operation if cookie is invalid', async () => {
    await serverStorage.users.create(USER_TYPES.ADMIN, 'someone', 'pass-123');
    const userData = (await serverStorage.users.get('someone'))!;
    await serverStorage.users.update('someone', {
      ...userData.data,
      cookie: {
        value: 'invalid-token',
        maxAge: Date.now() + 24 * 60 * 60 * 1000
      }
    });

    const username = await validateOperation({
      headers: {
        cookie: cookieHeader
      }
    } as Request);
    expect(username).toBe(null);
  });

  test('should not validate operation if cookie is old', async () => {
    await serverStorage.users.create(USER_TYPES.ADMIN, 'someone', 'pass-123');
    const userData = (await serverStorage.users.get('someone'))!;
    await serverStorage.users.update('someone', {
      ...userData.data,
      cookie: {
        value: 'valid-token',
        maxAge: Date.now() - 24 * 60 * 60 * 1000
      }
    });

    const username = await validateOperation({
      headers: {
        cookie: cookieHeader
      }
    } as Request);
    expect(username).toBe(null);
  });
});