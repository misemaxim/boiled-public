import { measureGlobalDistance } from './measure-global-distance';
import Map from 'ol/Map';
import { createMapContext } from './map-service';
import View from 'ol/View';
import { localSettings } from '../../../../lib/local-settings';
import { settingsValues } from './variables';

describe('measureGlobalDistance', () => {
  let map: Map;

  const INITIAL_ZOOM = 3;

  Object.defineProperty(document.body, 'clientWidth', {
    configurable: true,
    value: 1024
  });

  class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserver;

  beforeEach(() => {
    document.getElementById = (id: string) => {
      const target = document.createElement('div');
      target.id = id;

      return target;
    };

    const mapContext = createMapContext('map-container');
    map = mapContext.map;

    const view = {
      calculateExtent: jest.fn() as View['calculateExtent'],
      getZoom: jest.fn() as View['getZoom']
    } as View;
    map.getView = () => view;
  });

  afterEach(() => {
    localSettings.reset();
  });

  test('should return sector of measured lenght - km', () => {
    const view = map.getView();
    (view.calculateExtent as jest.Mock).mockReturnValueOnce([
      -10028538.111015124, -9001224.450862356, 10028538.111015124, 9001224.450862356
    ]);
    (view.getZoom as jest.Mock).mockReturnValueOnce(INITIAL_ZOOM);

    let measured = measureGlobalDistance(map, INITIAL_ZOOM);
    expect(measured).toBe('2346 km');

    (view.calculateExtent as jest.Mock).mockReturnValueOnce([
      -5576845.583686459, -5805913.038153044, 4451692.527328665, 3195311.4127093116
    ]);
    (view.getZoom as jest.Mock).mockReturnValueOnce(INITIAL_ZOOM + 1);

    measured = measureGlobalDistance(map, INITIAL_ZOOM);
    expect(measured).toBe('1242 km');
  });

  test('should return sector of measured lenght - mi', () => {
    localSettings.set('distanceUnit', settingsValues.UNIT_OF_LENGTH.MI);

    const view = map.getView();
    (view.calculateExtent as jest.Mock).mockReturnValueOnce([
      -10028538.111015124, -9001224.450862356, 10028538.111015124, 9001224.450862356
    ]);
    (view.getZoom as jest.Mock).mockReturnValueOnce(INITIAL_ZOOM);

    let measured = measureGlobalDistance(map, INITIAL_ZOOM);
    expect(measured).toBe('1458 mi');

    (view.calculateExtent as jest.Mock).mockReturnValueOnce([
      -5576845.583686459, -5805913.038153044, 4451692.527328665, 3195311.4127093116
    ]);
    (view.getZoom as jest.Mock).mockReturnValueOnce(INITIAL_ZOOM + 1);

    measured = measureGlobalDistance(map, INITIAL_ZOOM);
    expect(measured).toBe('772 mi');
  });
});
