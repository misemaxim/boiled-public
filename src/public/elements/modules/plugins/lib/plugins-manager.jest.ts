import axios, { AxiosRequestConfig } from 'axios';
import { jestMockCall } from '../../../../../../tests/jest-mock-call';
import {
  API_ROUTES,
  MapContext,
  PluginDefinition,
  PluginSchemaRaw,
  PluginTypes,
  ServerStorageItem
} from '../../../../../types';
import { sessionManager } from '../../../../lib/session-manager';
import { eventsScope } from '../../mapping/lib/map-events';
import { createMapContext } from '../../mapping/lib/map-service';
import { evaluatePluginScript, PossiblePluginScope } from './evalulate-plugin-script';
import { pluginsManager } from './plugins-manager';

jest.mock('./evalulate-plugin-script', () => ({
  evaluatePluginScript: jest.fn()
}));
jest.mock('../../../../lib/overlay-manager', () => ({
  overlayManager: {
    open: () => Promise.resolve('search-input'),
    close: () => {}
  }
}));

describe('pluginsManager', () => {
  let savedPlugins: Record<string, PluginSchemaRaw> = {};
  let mapContext: MapContext;

  class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserver;

  beforeEach(async () => {
    pluginsManager.clearCache();

    document.getElementById = (id: string) => {
      const target = document.createElement('div');
      target.id = id;

      return target;
    };
    mapContext = createMapContext('map-container');
    await mapContext.initializing;
    jest.clearAllMocks();

    savedPlugins = {};

    const definitions = [
      {
        _id: '1',
        data: {
          name: 'Plugin On Coordinates',
          type: PluginTypes.Coordinates,
          created: 1
        },
        timestamp: 1
      },
      {
        _id: '2',
        data: {
          name: 'Plugin On Search',
          type: PluginTypes.Search,
          created: 1
        },
        timestamp: 1
      },
      {
        _id: '3',
        data: {
          name: 'Plugin On Point',
          type: PluginTypes.Point,
          created: 1
        },
        timestamp: 1
      },
      {
        _id: '4',
        data: {
          name: 'Plugin On Refresh',
          type: PluginTypes.Refresh,
          created: 1
        },
        timestamp: 1
      }
    ] as ServerStorageItem<PluginDefinition>[];

    (axios.get as jest.Mock).mockImplementation(((path: string, params: AxiosRequestConfig) => {
      if (path === API_ROUTES.PLUGIN_GET) {
        const definition = definitions.find(def => def._id === params.params.id)!;

        return Promise.resolve({
          data: {
            data: {
              data: {
                type: definition.data.type,
                name: definition.data.name,
                script: `{ > ${definition.data.name} }`
              } as PluginSchemaRaw
            }
          }
        });
      }

      if (path === API_ROUTES.PLUGIN_DEFINTIONS) {
        return Promise.resolve({
          data: {
            data: definitions
          }
        });
      }
    }));

    (axios.post as jest.Mock).mockImplementation((path, data, params) => {
      if (path === API_ROUTES.PLUGIN_CREATE) {
        const session = data as PluginSchemaRaw;
        savedPlugins['created'] = session;
        return Promise.resolve({ data: { data: '5' } });
      }

      if (path === API_ROUTES.PLUGIN_UPDATE) {
        const session = data as PluginSchemaRaw;
        savedPlugins['updated-' + params.params.id] = session;
        return Promise.resolve({ data: {} });
      }
    });
  });

  describe('.save', () => {
    test('should save given plugin as new in server storage', async () => {
      await pluginsManager.save({
        name: 'New Plugin',
        type: PluginTypes.Search,
        script: 'NEW-PLUGIN-SCRIPT'
      });

      expect(savedPlugins).toEqual({
        created: {
          name: 'New Plugin',
          type: PluginTypes.Search,
          script: 'NEW-PLUGIN-SCRIPT'
        }
      });
    });

    test('should update given plugin in session storage', async () => {
      await pluginsManager.save({
        name: 'New Plugin',
        type: PluginTypes.Search,
        script: 'NEW-PLUGIN-SCRIPT'
      }, '123');

      expect(savedPlugins).toEqual({
        'updated-123': {
          name: 'New Plugin',
          type: PluginTypes.Search,
          script: 'NEW-PLUGIN-SCRIPT'
        }
      });
    });
  });

  describe('.load', () => {
    test('should get given plugin by id and keep it in memory', async () => {
      expect(axios.get).toBeCalledTimes(0);

      const plugin1 = await pluginsManager.load('1');
      expect(plugin1).toEqual({
        type: PluginTypes.Coordinates,
        name: 'Plugin On Coordinates',
        script: '{ > Plugin On Coordinates }'
      });

      expect(axios.get).toBeCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(API_ROUTES.PLUGIN_GET, { params: { id: '1' } });

      const plugin2 = await pluginsManager.load('1');
      expect(plugin2).toEqual(plugin1);

      expect(axios.get).toBeCalledTimes(1);
    });
  });

  describe('.definitions', () => {
    test('should get plugin definitions and keep it in memory', async () => {
      expect(axios.get).toBeCalledTimes(0);

      const defintions1 = await pluginsManager.definitions();
      expect(defintions1).toEqual([
        {
          _id: '1',
          data: { name: 'Plugin On Coordinates', type: 'coordinates', created: 1 },
          timestamp: 1
        },
        {
          _id: '2',
          data: { name: 'Plugin On Search', type: 'search', created: 1 },
          timestamp: 1
        },
        {
          _id: '3',
          data: { name: 'Plugin On Point', type: 'point', created: 1 },
          timestamp: 1
        },
        {
          _id: '4',
          data: { name: 'Plugin On Refresh', type: 'refresh', created: 1 },
          timestamp: 1
        }
      ]);

      expect(axios.get).toBeCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(API_ROUTES.PLUGIN_DEFINTIONS);

      const defintions2 = await pluginsManager.definitions();
      expect(defintions2).toEqual(defintions1);

      expect(axios.get).toBeCalledTimes(1);
    });
  });

  describe('.evaluate', () => {
    const checkCommonScope = (scope: PossiblePluginScope) => {
      expect(scope.session).toEqual(sessionManager.get());
      expect(scope.context!.initializing).toBe(mapContext.initializing);
      expect(scope.context!.methods).toBe(mapContext.methods);
      expect(scope.context!.groups).toBe(mapContext.groups);
      expect(scope.context!.points).toBe(mapContext.points);
      expect(scope.context!.map).toBe(mapContext.map);
    };

    test('should evaluate plugin with expected scope - coordinates', async () => {
      eventsScope.savedCoordinates = [1, 2];

      await pluginsManager.evaluate('1');

      expect(evaluatePluginScript).toBeCalledTimes(1);

      const evalCall = jestMockCall(evaluatePluginScript)[0];
      expect(evalCall[0]).toBe('{ > Plugin On Coordinates }');

      const scope = evalCall[1] as PossiblePluginScope;
      expect(scope.coordinates).toEqual([1, 2]);
      expect(scope.session).toEqual(sessionManager.get());

      checkCommonScope(scope);
    });

    test('should evaluate plugin with expected scope - search', async () => {
      await pluginsManager.evaluate('2');

      expect(evaluatePluginScript).toBeCalledTimes(1);

      const evalCall = jestMockCall(evaluatePluginScript)[0];
      expect(evalCall[0]).toBe('{ > Plugin On Search }');

      const scope = evalCall[1] as PossiblePluginScope;
      expect(scope.query).toBe('search-input');

      checkCommonScope(scope);
    });

    test('should evaluate plugin with expected scope - point', async () => {
      const session = sessionManager.get();
      const point = Object.values(session.points)[0][0];
      const group = session.groups.find(group => group.id === point.group);
      eventsScope.pointData = point;

      await pluginsManager.evaluate('3');

      expect(evaluatePluginScript).toBeCalledTimes(1);

      const evalCall = jestMockCall(evaluatePluginScript)[0];
      expect(evalCall[0]).toBe('{ > Plugin On Point }');

      const scope = evalCall[1] as PossiblePluginScope;
      expect(scope.point).toEqual(point);
      expect(scope.group).toEqual(group);

      checkCommonScope(scope);
    });

    test('should evaluate plugin with expected scope - refresh', async () => {
      await pluginsManager.evaluate('4');

      expect(evaluatePluginScript).toBeCalledTimes(1);

      const evalCall = jestMockCall(evaluatePluginScript)[0];
      expect(evalCall[0]).toBe('{ > Plugin On Refresh }');

      const scope = evalCall[1] as PossiblePluginScope;

      checkCommonScope(scope);
    });
  });
});
