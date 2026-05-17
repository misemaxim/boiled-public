import { sessionManager } from './session-manager';
import tempSession from '../../../tests/test-session.json';
import axios from 'axios';
import {
  API_ROUTES,
  PluginDefinition,
  PluginTypes,
  ServerStorageItem,
  SessionDefinition,
  SessionSchema,
  SessionSchemaDev
} from '../../types';
import { getAppConfig } from './get-app-config';

jest.mock('./session-manager', () => ({
  ...jest.requireActual('./session-manager')
}));

jest.mock('./get-app-config', () => ({
  getAppConfig: jest.fn(() => ({
    config: {
      public: {
        enabled: false,
        sessionId: '2',
        layers: [],
        message: 'Initial Message'
      }
    }
  }))
}));

describe('sessionManager', () => {
  let savedSessions: Record<string, SessionSchema> = {};

  let testSession: SessionSchema;

  Object.defineProperty(window, 'location', {
    writable: true,
    value: { reload: jest.fn() }
  });

  const setPublicAccess = () => {
    (getAppConfig as jest.Mock).mockReturnValueOnce({
      config: {
        public: {
          enabled: true,
          sessionId: '2',
          layers: [],
          message: 'Initial Message'
        }
      }
    });
  };

  beforeEach(() => {
    savedSessions = {};
    testSession = tempSession as SessionSchemaDev as SessionSchema;

    (axios.get as jest.Mock).mockImplementation((path, params) => {
      if (path === API_ROUTES.SESSION_DEFINTIONS) {
        return Promise.resolve({
          data: {
            data: [
              {
                _id: '1',
                data: {
                  name: tempSession.name,
                  created: 1
                },
                timestamp: 1
              },
              {
                _id: '2',
                data: {
                  name: 'Other',
                  created: 1
                },
                timestamp: 1
              }
            ] as ServerStorageItem<SessionDefinition>[]
          }
        });
      }

      if (path === API_ROUTES.SESSION_GET) {
        if (params.params.id === '1') {
          return Promise.resolve({
            data: {
              data: {
                data: { ...testSession }
              }
            }
          });
        }

        if (params.params.id === '2') {
          return Promise.resolve({
            data: {
              data: {
                data: { ...testSession, name: 'Public Access' }
              }
            }
          });
        }
      }

      if (path === API_ROUTES.PLUGIN_DEFINTIONS) {
        return Promise.resolve({
          data: {
            data: [
              {
                _id: '1',
                data: {
                  name: 'Context',
                  type: PluginTypes.Coordinates,
                  created: 1
                },
                timestamp: 1
              },
              {
                _id: '2',
                data: {
                  name: 'Refresh',
                  type: PluginTypes.Refresh,
                  created: 1
                },
                timestamp: 1
              },
              {
                _id: '3',
                data: {
                  name: 'Search',
                  type: PluginTypes.Search,
                  created: 1
                },
                timestamp: 1
              },
              {
                _id: '4',
                data: {
                  name: 'Point',
                  type: PluginTypes.Point,
                  created: 1
                },
                timestamp: 1
              }
            ] as ServerStorageItem<PluginDefinition>[]
          }
        });
      }
    });

    (axios.post as jest.Mock).mockImplementation((path, data, params) => {
      if (path === API_ROUTES.SESSION_CREATE) {
        const session = data as SessionSchema;
        savedSessions['created'] = session;
        return Promise.resolve({ data: { data: '2' } });
      }

      if (path === API_ROUTES.SESSION_UPDATE) {
        const session = data as SessionSchema;
        savedSessions['updated-' + params.params.id] = session;
        return Promise.resolve({ data: {} });
      }
    });
  });

  afterEach(async () => {
    await sessionManager.reset();
    jest.clearAllMocks();
  });

  describe('.definitions', () => {
    test('should return stored session definitions', async () => {
      const definitions = await sessionManager.definitions();

      expect(definitions).toEqual([
        {
          _id: '1',
          data: {
            name: tempSession.name,
            created: 1
          },
          timestamp: 1
        },
        {
          _id: '2',
          data: {
            name: 'Other',
            created: 1
          },
          timestamp: 1
        }
      ]);
    });
  });

  describe('.check', () => {
    test('should return empty session if no session in storage', async () => {
      const session = await sessionManager.check();

      expect(session).toEqual({
        groups: [],
        points: {},
        name: '',
        geometry: '',
        measurements: '',
        arrows: '',
        plugins: []
      });
    });

    test('should return session from temp storage', async () => {
      await sessionManager.cache({ ...testSession, name: '' });
      const session = await sessionManager.check();

      expect(session).toEqual({ ...testSession, name: '' });
      expect(sessionManager.status()).toEqual({
        id: '',
        storage: false,
        edited: false
      });
    });

    test('should return session from server storage', async () => {
      await sessionManager.load('1');

      await sessionManager.cache(testSession);
      const session = await sessionManager.check();

      expect(session).toEqual(testSession);
      expect(sessionManager.status()).toEqual({
        id: '1',
        storage: true,
        edited: false
      });
    });

    test('should return session from server storage marked as edited in temp storage', async () => {
      await sessionManager.load('1');

      await sessionManager.cache({ ...testSession, points: {} });
      const session = await sessionManager.check();

      expect(session).toEqual({ ...testSession, points: {} });
      expect(sessionManager.status()).toEqual({
        id: '1',
        storage: true,
        edited: true
      });
    });

    test('should resolve to public session based on config', async () => {
      setPublicAccess();

      const session = await sessionManager.check();
      expect(session.name).toBe('Public Access');
    });
  });

  describe('.get', () => {
    test('should get clone from active session', async () => {
      await sessionManager.cache(testSession);
      await sessionManager.check();

      const sessionClone1 = sessionManager.get();
      expect(sessionClone1).toEqual(testSession);

      const sessionClone2 = sessionManager.get();
      expect(sessionClone2).toEqual(testSession);

      expect(sessionClone1).not.toBe(sessionClone2);
    });
  });

  describe('.reset', () => {
    test('should clean state of temp storage', async () => {
      await sessionManager.reset();
      const session = sessionManager.get();

      expect(session).toEqual({
        groups: [],
        points: {},
        name: '',
        geometry: '',
        measurements: '',
        arrows: '',
        plugins: []
      });
    });
  });

  describe('.index', () => {
    test('should add changes to current session', async () => {
      await sessionManager.cache(testSession);
      await sessionManager.check();

      expect(sessionManager.get().points).toEqual(testSession.points);

      await sessionManager.index({ points: {} });

      expect(sessionManager.get().points).toEqual({});
    });

    test('should refresh session in temp storage', async () => {
      await sessionManager.cache(testSession);
      await sessionManager.check();

      const spy = jest.spyOn(sessionManager, 'cache');

      await sessionManager.index({ points: {} });

      expect(spy).toBeCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ ...testSession, points: {} });
    });

    test('should refresh plugins on current session', async () => {
      await sessionManager.cache(testSession);
      await sessionManager.check();

      const spy = jest.spyOn(sessionManager.plugins, 'refresh');

      await sessionManager.index();

      expect(spy).toBeCalledTimes(1);
    });

    test('should return indexed session', async () => {
      await sessionManager.cache(testSession);
      await sessionManager.check();

      const session = await sessionManager.index({ points: {} });

      expect(session).toEqual({ ...testSession, points: {} });
    });
  });

  describe('.save', () => {
    test('should save current session as new in server storage', async () => {
      await sessionManager.cache(testSession);
      await sessionManager.check();

      await sessionManager.save('123');

      expect(savedSessions).toEqual({
        created: { ...testSession, name: '123' }
      });
    });

    test('should update current session in session storage', async () => {
      await sessionManager.load('1');

      await sessionManager.cache({ ...testSession, points: {} });
      await sessionManager.check();

      await sessionManager.save();

      expect(savedSessions).toEqual({
        'updated-1': { ...testSession, points: {} }
      });
    });

    test('should set status as stored', async () => {
      // await sessionManager.load('1');

      await sessionManager.cache({ ...testSession, name: '' });
      await sessionManager.check();

      expect(sessionManager.status().storage).toBe(false);

      await sessionManager.save();

      expect(sessionManager.status().storage).toBe(true);
    });

    test('should set status as not edited', async () => {
      await sessionManager.index({ points: {} });

      expect(sessionManager.status().edited).toBe(true);

      await sessionManager.save();

      expect(sessionManager.status().edited).toBe(false);
    });
  });

  describe('.load', () => {
    test('should cache session when loaded', async () => {
      const spy = jest.spyOn(sessionManager, 'cache');

      await sessionManager.load('1');

      expect(spy).toBeCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(testSession);
    });

    test('should reload app', async () => {
      const spy = jest.spyOn(location, 'reload');

      await sessionManager.load('1');

      expect(spy).toBeCalledTimes(1);
    });
  });

  describe('.plugins', () => {
    describe('.get', () => {
      test('should get segregated plugins from the session', async () => {
        await sessionManager.cache(testSession);
        await sessionManager.check();

        await sessionManager.plugins.set(PluginTypes.Coordinates, ['1']);
        await sessionManager.plugins.set(PluginTypes.Refresh, ['2']);
        await sessionManager.plugins.set(PluginTypes.Search, ['3']);
        await sessionManager.plugins.set(PluginTypes.Point, ['4'], testSession.groups[0].id);

        expect(sessionManager.plugins.get()).toEqual({
          [PluginTypes.Coordinates]: [
            {
              _id: '1',
              data: {
                name: 'Context',
                type: PluginTypes.Coordinates,
                created: 1
              },
              timestamp: 1
            }
          ],
          [PluginTypes.Refresh]: [
            {
              _id: '2',
              data: {
                name: 'Refresh',
                type: PluginTypes.Refresh,
                created: 1
              },
              timestamp: 1
            }
          ],
          [PluginTypes.Search]: [
            {
              _id: '3',
              data: {
                name: 'Search',
                type: PluginTypes.Search,
                created: 1
              },
              timestamp: 1
            }
          ],
          [PluginTypes.Point]: {
            'L5TL3SwF5ptZUAYl': [
              {
                _id: '4',
                data: {
                  name: 'Point',
                  type: PluginTypes.Point,
                  created: 1
                },
                timestamp: 1
              }
            ]
          }
        });
      });
    });

    describe('.set', () => {
      test('should set plugins selection and overwrite previos', async () => {
        await sessionManager.cache(testSession);
        await sessionManager.check();

        await sessionManager.plugins.set(PluginTypes.Coordinates, ['1']);
        await sessionManager.plugins.set(PluginTypes.Refresh, ['2']);
        await sessionManager.plugins.set(PluginTypes.Search, ['3']);
        await sessionManager.plugins.set(PluginTypes.Point, ['4'], testSession.groups[0].id);

        await sessionManager.plugins.set(PluginTypes.Coordinates, []);
        await sessionManager.plugins.set(PluginTypes.Refresh, []);

        expect(sessionManager.plugins.get()).toEqual({
          [PluginTypes.Coordinates]: [],
          [PluginTypes.Refresh]: [],
          [PluginTypes.Search]: [
            {
              _id: '3',
              data: {
                name: 'Search',
                type: PluginTypes.Search,
                created: 1
              },
              timestamp: 1
            }
          ],
          [PluginTypes.Point]: {
            'L5TL3SwF5ptZUAYl': [
              {
                _id: '4',
                data: {
                  name: 'Point',
                  type: PluginTypes.Point,
                  created: 1
                },
                timestamp: 1
              }
            ]
          }
        });
      });
    });

    describe('.refresh', () => {
      test('should add plugins to current session', async () => {
        await sessionManager.cache(testSession);
        await sessionManager.check();

        await sessionManager.plugins.set(PluginTypes.Coordinates, ['1']);
        await sessionManager.plugins.set(PluginTypes.Refresh, ['2']);
        await sessionManager.plugins.set(PluginTypes.Search, ['3']);
        await sessionManager.plugins.set(PluginTypes.Point, ['4'], testSession.groups[0].id);

        await sessionManager.plugins.refresh();

        expect(sessionManager.get().groups[0].plugins).toEqual(['4']);
        expect(sessionManager.get().plugins.sort()).toEqual(['1', '2', '3']);
      });
    });
  });
});
