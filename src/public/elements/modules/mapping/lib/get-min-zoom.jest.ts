import { getMinZoom } from './get-min-zoom';

describe('getMinZoom', () => {
  beforeEach(() => {
    document.getElementById = (selector: string) => {
      if (selector === 'map-container') {
        const container = document.createElement('div');
        Object.defineProperty(container, 'clientWidth', {
          configurable: true,
          value: 1024
        });
        Object.defineProperty(container, 'clientHeight', {
          configurable: true,
          value: 768
        });

        return container;
      }

      return null;
    };
  });

  test('should define min zoom', () => {
    const minZoom = getMinZoom('map-container');
    expect(minZoom).toEqual({ byHeight: 2, byWidth: 2 });
  });
});
