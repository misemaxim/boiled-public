import { localSettings } from './local-settings';

describe('localSettings', () => {
  describe('.get', () => {
    test('should get stored settings', () => {
      localSettings.set('defaultLayerId', 'A');

      expect(localSettings.get('defaultLayerId')).toBe('A');
    });

    test('should get default settings if not set as local', () => {
      localSettings.set('defaultLayerId', undefined);

      expect(localSettings.get('defaultLayerId')).toBe('stamen_toner');
    });
  });

  describe('.reset', () => {
    test('should reset stored settings to default', () => {
      localSettings.set('defaultLayerId', 'A');
      localSettings.reset();

      expect(localSettings.get('defaultLayerId')).toBe('stamen_toner');
    });
  });
});
