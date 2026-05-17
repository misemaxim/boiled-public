import { Map, View } from 'ol';
import { createMapMethods } from './map-methods';

describe('createMapMethods', () => {
  let map: Map;

  const coords = [12.360103, 51.340199] as [number, number];

  const getViewAnimate = jest.fn() as View['animate'];
  const getViewSetZoom = jest.fn() as View['setZoom'];

  beforeEach(() => {
    map = {
      getView: () => ({
        animate: getViewAnimate,
        getZoom: () => 15,
        setZoom: getViewSetZoom
      })
    } as Map;

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (callback: (position: GeolocationPosition) => void) => callback({
          coords: {
            longitude: coords[0],
            latitude: coords[1]
          } as GeolocationPosition['coords']
        } as GeolocationPosition)
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('.goToCoordinates', () => {
    test('should go to given coordinates', () => {
      const methods = createMapMethods(map);
      methods.goToCoordinates(coords);

      expect(getViewAnimate).toBeCalledTimes(1);
      expect(getViewAnimate).toHaveBeenCalledWith({
        center: [1375920.3721124132, 6681693.04758511],
        duration: 300,
        zoom: 15
      });
    });

    test('should go to given coordinates and zoom', () => {
      const methods = createMapMethods(map);
      methods.goToCoordinates(coords, 19);

      expect(getViewAnimate).toBeCalledTimes(1);
      expect(getViewAnimate).toHaveBeenCalledWith({
        center: [1375920.3721124132, 6681693.04758511],
        duration: 300,
        zoom: 19
      });
    });
  });

  describe('.goToCurrentCoordinates', () => {
    test('should go to navigator coordinates', () => {
      const methods = createMapMethods(map);
      methods.goToCurrentCoordinates();

      expect(getViewAnimate).toBeCalledTimes(1);
      expect(getViewAnimate).toHaveBeenCalledWith({
        center: [1375920.3721124132, 6681693.04758511],
        duration: 1000,
        zoom: 10
      });
    });
  });

  describe('.zoomIn', () => {
    test('should zoom in', () => {
      const methods = createMapMethods(map);
      methods.zoomIn();

      expect(getViewSetZoom).toBeCalledTimes(1);
      expect(getViewSetZoom).toHaveBeenCalledWith(16);
    });
  });

  describe('.zoomOut', () => {
    test('should zoom out', () => {
      const methods = createMapMethods(map);
      methods.zoomOut();

      expect(getViewSetZoom).toBeCalledTimes(1);
      expect(getViewSetZoom).toHaveBeenCalledWith(14);
    });
  });
});