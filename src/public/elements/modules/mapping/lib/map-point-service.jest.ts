import { mapPointsService } from './map-point-service';
import testSession from '../../../../../../tests/test-session.json';
import { PointData, MapContext } from '../../../../../types';
import { createMapContext } from './map-service';
import { jestMockCall } from '../../../../../../tests/jest-mock-call';
import Feature from 'ol/Feature';
import { getPointStyles } from './styles';
import { fromLonLat } from 'ol/proj';
import Point from 'ol/geom/Point';

describe('mapPointsService', () => {
  let mapContext: MapContext;

  const group = Object.values(testSession.groups)[0];
  const point: PointData = {
    id: '1',
    name: 'new-point',
    coordinates: [3, 4],
    group: group.id,
    properties: ['prop'],
    created: 0
  };

  class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserver;

  beforeEach(async () => {
    document.getElementById = (id: string) => {
      const target = document.createElement('div');
      target.id = id;

      return target;
    };

    mapContext = createMapContext('map-container');
    await mapContext.initializing;

    mapContext.segments.vector.source.addFeature = jest.fn();
    mapContext.segments.temp.source.addFeature = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('.add', () => {
    test('should add point on map', () => {
      mapPointsService.add({ point, group });

      expect(mapContext.segments.vector.source.addFeature).toBeCalledTimes(1);
      const feature = jestMockCall(mapContext.segments.vector.source.addFeature)[0][0];
      expect(feature instanceof Feature).toBe(true);
      expect(feature.getId()).toBe(point.id);
      expect(feature.get('pointData')).toEqual(point);
      expect(feature.get('style')).toEqual(getPointStyles({
        highlighted: false,
        name: point.name,
        color: group.color,
        icon: group.icon
      }));
      expect(feature.getGeometry().getCoordinates()).toEqual(fromLonLat(point.coordinates));
    });
  });

  describe('.update', () => {
    test('should update point data', () => {
      const updateValue = Date.now() + '';
      const initialPoint = Object.values(testSession.points)[0][0];
      const initialPointUpdate = {
        ...initialPoint,
        name: updateValue,
        coordinates: [initialPoint.coordinates[0] + 1, initialPoint.coordinates[1] + 2]
      } as PointData;

      mapPointsService.update({ point: initialPointUpdate });

      const feature = mapContext.segments.vector.source.getFeatureById(initialPoint.id)!;
      expect(feature.get('pointData')).toEqual(initialPointUpdate);
      expect((feature.getGeometry() as Point).getCoordinates()).toEqual(fromLonLat(initialPointUpdate.coordinates));
    });
  });

  describe('.temp', () => {
    test('should add temporary data', () => {
      const point = {
        name: 'temp-point',
        color: '#CCCCCC',
        icon: 'email',
        coordinates: [0, 2] as [number, number]
      };
      mapPointsService.temp({ point });

      expect(mapContext.segments.temp.source.addFeature).toBeCalledTimes(1);
      const feature = jestMockCall(mapContext.segments.temp.source.addFeature)[0][0];
      expect(feature instanceof Feature).toBe(true);
      expect(feature.get('style')).toEqual(getPointStyles({
        highlighted: false,
        name: point.name,
        color: point.color,
        icon: point.icon
      }));
      expect(feature.getGeometry().getCoordinates()).toEqual(fromLonLat(point.coordinates));
    });
  });
});
