import { cloneDeep, noop } from 'lodash';
import testSession from './test-session.json';
import {
  PluginDefinition,
  PluginTypes,
  ServerStorageItem,
  SessionDefinition,
  SessionSchema,
  SessionSchemaDev
} from '../src/types';

const resetSessionPlugins = (): {
  [PluginTypes.Coordinates]: ServerStorageItem<PluginDefinition>[],
  [PluginTypes.Refresh]: ServerStorageItem<PluginDefinition>[],
  [PluginTypes.Search]: ServerStorageItem<PluginDefinition>[],
  [PluginTypes.Point]: Record<string, ServerStorageItem<PluginDefinition>[]>
} => ({
  [PluginTypes.Coordinates]: [],
  [PluginTypes.Refresh]: [],
  [PluginTypes.Search]: [],
  [PluginTypes.Point]: {}
});
const sessionPlugins = resetSessionPlugins();

const pluginDefinitions = [
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
] as ServerStorageItem<PluginDefinition>[];

let session: SessionSchema = {
  groups: [],
  points: {},
  name: '',
  geometry: '',
  measurements: '',
  arrows: '',
  plugins: []
};
const sessionStorageStatus = {
  id: '',
  storage: false,
  edited: false
};

export const mockSessionManager = {
  cache: noop,
  index: jest.fn(async (sessionPartials: Partial<SessionSchema> = {}): Promise<SessionSchema> => {
    session = { ...session, ...sessionPartials };

    return Promise.resolve(session);
  }),
  check: async (): Promise<SessionSchema> => {
    session = { ...testSession } as SessionSchemaDev as SessionSchema;
    sessionStorageStatus.id = '1';

    return Promise.resolve(cloneDeep(session));
  },
  get: () => cloneDeep(session),
  import: noop,
  export: noop,
  reset: noop,
  save: noop,
  load: noop,
  definitions: async (): Promise<ServerStorageItem<SessionDefinition>[]> => {
    return Promise.resolve([
      {
        _id: '1',
        data: {
          name: testSession.name,
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
  },
  status: () => ({ ...sessionStorageStatus, id: '1' }),
  plugins: {
    get: () => ({ ...sessionPlugins }),
    set: async (type: PluginTypes, ids: string[], groupId?: string) => {
      if (type === PluginTypes.Point) {
        if (!groupId) {
          throw 'groupId is required';
        }

        sessionPlugins[type][groupId!] = pluginDefinitions.filter(plugin => {
          return plugin.data.type === type && ids.includes(plugin._id);
        });
      } else {
        sessionPlugins[type] = pluginDefinitions.filter(plugin => {
          return plugin.data.type === type && ids.includes(plugin._id);
        });
      }
    },
    refresh: () => {
      Object.keys(sessionPlugins[PluginTypes.Point]).forEach(groupId => {
        const group = session.groups.find(group => group.id === groupId);
        if (group) {
          group.plugins = sessionPlugins[PluginTypes.Point][groupId].map(plugin => plugin._id);
        }
      });

      session.plugins = [
        ...[
          ...sessionPlugins[PluginTypes.Coordinates],
          ...sessionPlugins[PluginTypes.Search],
          ...sessionPlugins[PluginTypes.Refresh]
        ].map(plugin => plugin._id)
      ];
    }
  }
};
