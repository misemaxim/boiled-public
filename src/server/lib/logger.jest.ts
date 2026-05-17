import { jestMockCall } from '../../../tests/jest-mock-call';
import { logger } from './logger';

describe('logger', () => {
  const consoleSpy = jest.spyOn(console, 'log');

  afterEach(() => {
    consoleSpy.mockReset();
  });

  describe('.message', () => {
    test('should create message log', () => {
      logger.message('123');

      expect(consoleSpy).toBeCalledTimes(1);
      const call = jestMockCall(consoleSpy)[0];
      expect(call[0]).toContain('MESSAGE');
      expect(call[2]).toContain('2023-10-10');
      expect(call[4]).toContain('123');
    });

    test('should create warning log', () => {
      logger.warning('456');

      expect(consoleSpy).toBeCalledTimes(1);
      const call = jestMockCall(consoleSpy)[0];
      expect(call[0]).toContain('WARNING');
      expect(call[2]).toContain('2023-10-10');
      expect(call[4]).toContain('456');
    });

    test('should create warning log', () => {
      logger.error('789');

      expect(consoleSpy).toBeCalledTimes(1);
      const call = jestMockCall(consoleSpy)[0];
      expect(call[0]).toContain('ERROR');
      expect(call[2]).toContain('2023-10-10');
      expect(call[4]).toContain('789');
    });
  });
});