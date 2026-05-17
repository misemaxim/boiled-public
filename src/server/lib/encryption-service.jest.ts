import { encryptionService } from './encryption-service';

describe('encryptionService', () => {
  describe('.encrypt', () => {
    test('should encrypt given value', async () => {
      const secret = encryptionService.encrypt('SOME-TEST-VALUE');

      expect(secret).toBe('01ac6dc583319d8741652fa2479c012c');
    });
  });

  describe('.decrypt', () => {
    test('should decrypt secret for given value', async () => {
      const secret = encryptionService.encrypt('SOME-TEST-VALUE');
      const value = encryptionService.decrypt(secret);

      expect(value).toBe('SOME-TEST-VALUE');
    });
  });
});
