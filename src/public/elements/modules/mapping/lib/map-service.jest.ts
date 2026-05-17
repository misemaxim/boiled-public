import { MapContext, PluginTypes, PointData } from '../../../../../types';
import { sessionManager } from '../../../../lib/session-manager';
import { createMapInteractionsScope, addGeometryOnMap } from './map-interactions-scope';
import { createMapContext } from './map-service';
import { jestMockCall } from '../../../../../../tests/jest-mock-call';
import testSession from '../../../../../../tests/test-session.json';
import { layersService } from './layers-service';
import { mapPointsService } from './map-point-service';
import { pluginsManager } from '../../plugins/lib/plugins-manager';
import Feature from 'ol/Feature';

jest.mock('./map-interactions-scope', () => ({
  createMapInteractionsScope: jest.fn(() => ({ scope: 'interactions' })),
  addGeometryOnMap: jest.fn()
}));
jest.mock('./map-methods', () => ({
  createMapMethods: jest.fn(() => ({ scope: 'navigate-methods' }))
}));
jest.mock('./map-point-service', () => ({
  mapPointsService: {
    add: jest.fn(),
    update: jest.fn()
  }
}));

describe('createMapContext', () => {
  let target: HTMLDivElement;
  let mapContext: MapContext;

  class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserver;

  beforeEach(() => {
    pluginsManager.evaluate = jest.fn();

    document.getElementById = (id: string) => {
      target = document.createElement('div');
      target.id = id;

      return target;
    };

    mapContext = createMapContext('map-container');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('.initializing', () => {
    test('should wait to add points on map', async () => {
      await mapContext.initializing;

      expect(mapPointsService.add).toBeCalledTimes(1);
      expect(mapPointsService.add).toHaveBeenCalledWith({
        point: Object.values(testSession.points)[0][0],
        group: testSession.groups[0]
      });
    });

    test('should wait to add geometry on map', async () => {
      await mapContext.initializing;

      expect(addGeometryOnMap).toBeCalledTimes(1);
      expect(addGeometryOnMap).toHaveBeenCalledWith(sessionManager.get(), mapContext);
    });

    test('should wait to initialize layers', async () => {
      await mapContext.initializing;

      const spyLayersService = jest.spyOn(layersService, 'initialize');

      mapContext = createMapContext('map-container');
      await mapContext.initializing;

      expect(spyLayersService).toBeCalledTimes(1);
    });
  });

  describe('.interactions', () => {
    test('should create scope of interactions on map', () => {
      expect(createMapInteractionsScope).toBeCalledTimes(1);
      const interactionsCall = jestMockCall(createMapInteractionsScope)[0];

      expect(interactionsCall[0]).toBe(mapContext.map);
      expect(interactionsCall[1][0].get('id')).toBe('draw');
      expect(interactionsCall[1][1].get('id')).toBe('arrows');

      expect(mapContext.interactions).toEqual({ scope: 'interactions' });
    });
  });

  describe('.segments', () => {
    test('should expose segments of each system layer', () => {
      expect(mapContext.segments.vector.source.get('id')).toBe('vector');
      expect(mapContext.segments.vector.view.getSource()).toBe(mapContext.segments.vector.source);

      expect(mapContext.segments.draw.source.get('id')).toBe('draw');
      expect(mapContext.segments.draw.view.getSource()).toBe(mapContext.segments.draw.source);

      expect(mapContext.segments.arrows.source.get('id')).toBe('arrows');
      expect(mapContext.segments.arrows.view.getSource()).toBe(mapContext.segments.arrows.source);

      expect(mapContext.segments.temp.source.get('id')).toBe('temp');
      expect(mapContext.segments.temp.view.getSource()).toBe(mapContext.segments.temp.source);
    });
  });

  describe('.methods', () => {
    test('should create scope of map methods to navigate', () => {
      expect(mapContext.methods).toEqual({ scope: 'navigate-methods' });
    });
  });

  describe('.groups', () => {
    describe('.add', () => {
      test('should add given group on session', async () => {
        const preset = {
          name: 'group-1',
          icon: 'home',
          color: '#000007',
          properties: ['prop-1'],
          plugins: ['plugin-1']
        };

        await mapContext.initializing;

        let session = sessionManager.get();
        expect(session.groups).toHaveLength(1);

        mapContext.groups.add(preset);

        session = sessionManager.get();
        expect(session.groups).toHaveLength(2);
        expect(session.groups[1]).toMatchObject(preset);
      });

      test('should index session when added', async () => {
        await mapContext.initializing;

        const preset = {
          name: 'group-1',
          icon: 'home',
          color: '#000007',
          properties: ['prop-1'],
          plugins: ['plugin-1']
        };

        await mapContext.initializing;

        mapContext.groups.add(preset);

        const spy = jest.spyOn(sessionManager, 'index');

        const session = sessionManager.get();
        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(session);
      });
    });

    describe('.delete', () => {
      test('should remove group from the session', async () => {
        await mapContext.initializing;

        const id = sessionManager.get().groups[0].id;

        mapContext.groups.delete(id);

        expect(sessionManager.get().groups).toHaveLength(0);
      });

      test('should remove associated points from the session', async () => {
        await mapContext.initializing;

        const point = Object.values(sessionManager.get().points)[0][0] as PointData;

        expect(sessionManager.get().points[point.group]).toHaveLength(1);

        mapContext.points.delete([point.group, point.id]);

        expect(sessionManager.get().points[point.group]).toHaveLength(0);
      });

      test('should remove associated points from the layer', async () => {
        await mapContext.initializing;

        const point = Object.values(sessionManager.get().points)[0][0] as PointData;

        mapContext.segments.vector.source.removeFeature = jest.fn();
        mapContext.segments.vector.source.getFeatureById = id => ({ mock: 'feature - ' + id } as unknown as Feature);

        expect(mapContext.segments.vector.source.removeFeature).toBeCalledTimes(0);

        mapContext.points.delete([point.group, point.id]);

        expect(mapContext.segments.vector.source.removeFeature).toBeCalledTimes(1);
        expect(mapContext.segments.vector.source.removeFeature).toHaveBeenCalledWith({ mock: 'feature - UHOp25qZSqjag3Ob' });
      });

      test('should index session when removed', async () => {
        await mapContext.initializing;

        const point = Object.values(sessionManager.get().points)[0][0] as PointData;

        const spy = jest.spyOn(sessionManager, 'index');

        mapContext.points.delete([point.group, point.id]);

        const session = sessionManager.get();
        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(session);
      });
    });
  });

  describe('.points', () => {
    const point = Object.freeze({
      coordinates: [60, 90] as [number, number],
      id: 'point-1',
      name: 'Point-1-Name',
      group: testSession.groups[0].id,
      properties: [],
      created: 123
    });

    describe('.add', () => {
      test('should add given point on session', async () => {
        await mapContext.initializing;
        mapContext.points.add(point);

        const session = sessionManager.get();
        expect(session.points[session.groups[0].id]).toHaveLength(2);
        expect(session.points[session.groups[0].id][1]).toEqual(point);
      });

      test('should add given point on map', async () => {
        await mapContext.initializing;
        jest.clearAllMocks();

        mapContext.points.add(point);

        const session = sessionManager.get();
        expect(mapPointsService.add).toBeCalledTimes(1);
        expect(mapPointsService.add).toHaveBeenCalledWith({ point, group: session.groups[0] });
      });

      test('should index session when added', async () => {
        await mapContext.initializing;

        const spy = jest.spyOn(sessionManager, 'index');

        mapContext.points.add(point);

        const session = sessionManager.get();
        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(session);
      });
    });

    describe('.update', () => {
      const initialPoint = Object.values(testSession.points)[0][0];
      const updatedPoint = Object.freeze({
        ...initialPoint,
        name: initialPoint.name + '-updated',
        coordinates: [1, 2] as [number, number]
      });

      test('should update given point on session', async () => {
        await mapContext.initializing;

        mapContext.points.update(updatedPoint);

        const session = sessionManager.get();
        expect(session.points[session.groups[0].id]).toHaveLength(1);
        expect(session.points[session.groups[0].id][0]).toEqual(updatedPoint);
      });

      test('should update given point on map', async () => {
        await mapContext.initializing;
        jest.clearAllMocks();

        mapContext.points.update(updatedPoint);

        expect(mapPointsService.update).toBeCalledTimes(1);
        expect(mapPointsService.update).toHaveBeenCalledWith({ point: updatedPoint });
      });

      test('should index session when updated', async () => {
        await mapContext.initializing;

        const spy = jest.spyOn(sessionManager, 'index');

        mapContext.points.update(updatedPoint);

        const session = sessionManager.get();
        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(session);
      });
    });

    describe('.delete', () => {
      const point = Object.values(testSession.points)[0][0] as PointData;

      test('should remove point from the session', async () => {
        await mapContext.initializing;

        expect(sessionManager.get().points[point.group]).toHaveLength(1);

        mapContext.points.delete([point.group, point.id]);

        expect(sessionManager.get().points[point.group]).toHaveLength(0);
      });

      test('should remove point from the layer', async () => {
        await mapContext.initializing;

        mapContext.segments.vector.source.removeFeature = jest.fn();
        mapContext.segments.vector.source.getFeatureById = id => ({ mock: 'feature - ' + id } as unknown as Feature);

        expect(mapContext.segments.vector.source.removeFeature).toBeCalledTimes(0);

        mapContext.points.delete([point.group, point.id]);

        expect(mapContext.segments.vector.source.removeFeature).toBeCalledTimes(1);
        expect(mapContext.segments.vector.source.removeFeature).toHaveBeenCalledWith({ mock: 'feature - UHOp25qZSqjag3Ob' });
      });

      test('should index session when removed', async () => {
        await mapContext.initializing;

        const spy = jest.spyOn(sessionManager, 'index');

        mapContext.points.delete([point.group, point.id]);

        const session = sessionManager.get();
        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(session);
      });
    });
  });

  describe('.layers', () => {
    beforeEach(() => {
      mapContext.layers.select(mapContext.layers.getAvailable()[0].id);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('.getCurrent', () => {
      test('should get current layer id', () => {
        let id = mapContext.layers.getCurrent();
        expect(id).toBe(mapContext.layers.getAvailable()[0].id);

        mapContext.layers.select(mapContext.layers.getAvailable()[1].id);

        id = mapContext.layers.getCurrent();
        expect(id).toBe(mapContext.layers.getAvailable()[1].id);
      });
    });

    describe('.select', () => {
      test('should set selected layer on map', () => {
        const spyLayersService = jest.spyOn(layersService, 'select');

        mapContext.layers.select(mapContext.layers.getAvailable()[1].id);

        const id = mapContext.layers.getCurrent();
        expect(id).toBe(mapContext.layers.getAvailable()[1].id);

        expect(spyLayersService).toBeCalledTimes(1);
        expect(spyLayersService).toHaveBeenCalledWith({
          baseLayerId: mapContext.layers.getAvailable()[1].id,
          mapContext
        });
      });
    });

    describe('.toggleGraticule', () => {
      test('should enable graticule on map', () => {
        const spyLayersService = jest.spyOn(layersService, 'select');

        mapContext.layers.toggleGraticule(true);

        expect(spyLayersService).toBeCalledTimes(1);
        expect(spyLayersService).toHaveBeenCalledWith({
          baseLayerId: mapContext.layers.getAvailable()[0].id,
          mapContext,
          graticule: true
        });
      });

      test('should disable graticule on map', () => {
        mapContext.layers.toggleGraticule(true);

        const spyLayersService = jest.spyOn(layersService, 'select');

        mapContext.layers.toggleGraticule(false);

        expect(spyLayersService).toBeCalledTimes(1);
        expect(spyLayersService).toHaveBeenCalledWith({
          baseLayerId: mapContext.layers.getAvailable()[0].id,
          mapContext,
          graticule: false
        });
      });
    });
  });

  describe('.refresh', () => {
    describe('.run', () => {
      test('should clear all system layers', () => {
        mapContext.segments.draw.source.clear = jest.fn();
        mapContext.segments.arrows.source.clear = jest.fn();
        mapContext.segments.temp.source.clear = jest.fn();
        mapContext.segments.vector.source.clear = jest.fn();

        mapContext.refresh.run();

        expect(mapContext.segments.draw.source.clear).toBeCalledTimes(1);
        expect(mapContext.segments.arrows.source.clear).toBeCalledTimes(1);
        expect(mapContext.segments.temp.source.clear).toBeCalledTimes(1);
        expect(mapContext.segments.vector.source.clear).toBeCalledTimes(1);
      });

      test('should add points back on map', async () => {
        await mapContext.initializing;
        (mapPointsService.add as jest.Mock).mockClear();

        mapContext.refresh.run();

        expect(mapPointsService.add).toBeCalledTimes(1);
        expect(mapPointsService.add).toHaveBeenCalledWith({
          point: Object.values(testSession.points)[0][0],
          group: testSession.groups[0]
        });
      });

      test('should add geometry back on map', async () => {
        await mapContext.initializing;
        (addGeometryOnMap as jest.Mock).mockClear();

        mapContext.refresh.run();

        const session = sessionManager.get();

        expect(addGeometryOnMap).toBeCalledTimes(1);
        expect(addGeometryOnMap).toHaveBeenCalledWith(session, mapContext);
      });

      test('should re-run active refresh plugins', async () => {
        await mapContext.initializing;

        sessionManager.plugins.set(PluginTypes.Refresh, ['2']);

        mapContext.refresh.run();

        expect(pluginsManager.evaluate).toBeCalledTimes(1);
        expect(pluginsManager.evaluate).toHaveBeenCalledWith('2');

        sessionManager.plugins.set(PluginTypes.Refresh, []);
      });
    });

    describe('.auto', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        mapContext.refresh.auto(null);
        jest.useRealTimers();
      });

      test('should configure refresh interval', () => {
        const INTERVAL_S = 15;
        const spy = jest.spyOn(mapContext.refresh, 'run');

        mapContext.refresh.auto(15);

        expect(spy).toBeCalledTimes(0);

        jest.advanceTimersByTime(INTERVAL_S * 1000);

        expect(spy).toBeCalledTimes(1);

        jest.advanceTimersByTime(INTERVAL_S * 1000);

        expect(spy).toBeCalledTimes(2);
      });

      test('should remove refresh interval', () => {
        const INTERVAL_S = 15;
        const spy = jest.spyOn(mapContext.refresh, 'run');

        mapContext.refresh.auto(15);

        expect(spy).toBeCalledTimes(0);

        jest.advanceTimersByTime(INTERVAL_S * 1000);

        expect(spy).toBeCalledTimes(1);

        mapContext.refresh.auto(null);
        jest.advanceTimersByTime(INTERVAL_S * 1000);

        expect(spy).toBeCalledTimes(1);
      });

      test('should have flag to detect refresh interval', () => {
        mapContext.refresh.auto(15);

        expect(mapContext.refresh.isAuto()).toBe(true);

        mapContext.refresh.auto(null);

        expect(mapContext.refresh.isAuto()).toBe(false);
      });
    });
  });
});
