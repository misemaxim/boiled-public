import { hashService } from './hash-service';

describe('hashService', () => {
  describe('.get', () => {
    test('should return hashed value for given string', async () => {
      expect(typeof (await hashService.get('secret', '123456789'))).toBe('string');
    });
  });

  describe('.verify', () => {
    test('should verify hashed value for given string', async () => {
      const salt = '123456789';
      const hash = await hashService.get('secret', salt);

      expect(await hashService.verify(hash, 'secret', salt)).toBe(true);
    });

    test('should not verify hashed value for unexpected string', async () => {
      const salt = '123456789';
      const hash = await hashService.get('secret', salt);

      expect(await hashService.verify(hash, 'unexpected', salt)).toBe(false);
    });
  });
});