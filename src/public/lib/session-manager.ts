import { DeviceStorage } from './device-storage';
import { cloneDeep, isEqual } from 'lodash';
import { API_ROUTES, PluginDefinition, PluginTypes, ServerStorageItem, SessionDefinition, SessionSchema } from '../../types';
import { pluginsManager } from '../elements/modules/plugins/lib/plugins-manager';
import { showMessage } from '../interface/show-message';
import { customAxios } from './custom-axios';
import { getAppConfig } from './get-app-config';

const deviceStorage = new DeviceStorage();

let sessionId = '';
const defaultSession = (): SessionSchema => ({
  groups: [],
  points: {},
  name: '',
  geometry: '',
  measurements: '',
  arrows: '',
  plugins: []
});
let session = defaultSession();

const sessionStorageStatus = {
  id: '',
  storage: false,
  edited: false
};

export const tempSessionId = 'temp_session';

let definitions: ServerStorageItem<SessionDefinition>[] = [];

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
let sessionPlugins = resetSessionPlugins();
const fetchSessionPlugins = async (session: SessionSchema) => {
  sessionPlugins = resetSessionPlugins();

  const pluginDefinitions = await pluginsManager.definitions();

  session.groups.forEach(group => {
    group.plugins.forEach(id => {
      const def = pluginDefinitions.find(d => d._id === id);
      if (def) {
        if (!sessionPlugins[PluginTypes.Point][group.id]) {
          sessionPlugins[PluginTypes.Point][group.id] = [];
        }

        sessionPlugins[PluginTypes.Point][group.id].push(def);
      }
    });
  });

  session.plugins.forEach(id => {
    const def = pluginDefinitions.find(d => d._id === id);
    if (def && def.data.type !== PluginTypes.Point) {
      sessionPlugins[def.data.type].push(def);
    }
  });
};

const callbacks: {
  index: (() => void)[]
} = {
  index: []
};

export const sessionManager = {
  clearCache: async () => {
    definitions = [];

    session = defaultSession();
    await sessionManager.cache(session);
  },
  cache: async (session: SessionSchema) => {
    await deviceStorage.set({
      _id: tempSessionId,
      timestamp: Date.now(),
      data: {
        id: sessionId,
        data: session
      }
    });
  },
  index: async (sessionPartials: Partial<SessionSchema> = {}): Promise<SessionSchema> => {
    session = { ...session, ...sessionPartials };

    sessionManager.plugins.refresh();
    await sessionManager.cache(session);

    sessionStorageStatus.edited = true;
    callbacks.index.forEach(callback => callback());

    return session;
  },
  onIndex: (callback: () => void) => {
    callbacks.index.push(callback);
  },
  check: async (): Promise<SessionSchema> => {
    sessionStorageStatus.edited = false;
    sessionStorageStatus.storage = false;

    const config = getAppConfig().config;
    if (config.public.enabled) {
      const errorText = 'Public session has not been configured. Please contact the administrator';

      const publicSessionId = config.public.sessionId;
      if (!publicSessionId) {
        showMessage(errorText);
      } else {
        const response = await customAxios.get(API_ROUTES.SESSION_GET, { params: { id: publicSessionId } });
        if (!response) {
          showMessage(errorText);
        } else {
          session = response.data;
        }
      }
    } else {
      const storedSession = await deviceStorage.get(tempSessionId);
      if (storedSession) {
        await fetchSessionPlugins(storedSession.data.data as SessionSchema);
        session = { ...session, ...storedSession.data.data as SessionSchema };

        const defs = await sessionManager.definitions();
        const existing = defs.find(def => def._id === storedSession.data.id);
        if (existing) {
          sessionId = existing._id;
          const response = await customAxios.get(API_ROUTES.SESSION_GET, { params: { id: sessionId } });

          sessionStorageStatus.storage = true;
          sessionStorageStatus.edited = !isEqual(session, response.data);
        }
      }
    }

    return cloneDeep(session);
  },
  get: () => cloneDeep(session),
  import: async (file: File) => {
    const reader = new FileReader();
    const errorText = 'Cannot open local session from the selected file: ';

    reader.readAsText(file, 'UTF-8');
    reader.onload = event => {
      try {
        session = JSON.parse(event.target?.result as string);
        showMessage('Local session is loaded successfully - ' + file.name);
      } catch (error) {
        showMessage(errorText + file.name);
      }
    };
    reader.onerror = () => {
      showMessage(errorText + file.name);
    };
  },
  export: async (name: string) => {
    const data = new Blob([JSON.stringify({ id: sessionId, data: session })], { type: 'text/plain' });
    const textFile = window.URL.createObjectURL(data);

    const link = document.createElement('a');
    link.setAttribute('download', name + '.boiledapp');
    link.href = textFile;
    document.body.appendChild(link);

    window.requestAnimationFrame(() => {
      const event = new MouseEvent('click');
      link.dispatchEvent(event);
      document.body.removeChild(link);
    });
  },
  reset: async () => {
    sessionId = '';
    session = defaultSession();
    await deviceStorage.reset();
  },
  save: async (newName?: string) => {
    sessionStorageStatus.storage = true;
    sessionStorageStatus.edited = false;

    if (newName) {
      session.name = newName;

      const response = await customAxios.post(API_ROUTES.SESSION_CREATE, session);
      const uiTimestamp = Date.now();
      sessionId = response;
      definitions.push({
        _id: sessionId,
        data: {
          name: newName,
          created: uiTimestamp
        },
        timestamp: uiTimestamp
      });
    } else {
      await customAxios.post(API_ROUTES.SESSION_UPDATE, session, { params: { id: sessionId } });
    }

    showMessage('Current Session Is Saved');
  },
  load: async (id: string): Promise<void> => {
    sessionId = id;

    const response = await customAxios.get(API_ROUTES.SESSION_GET, { params: { id } });

    await sessionManager.cache(response.data);
    location.reload();
  },
  definitions: async (): Promise<ServerStorageItem<SessionDefinition>[]> => {
    if (definitions.length) {
      return definitions;
    }

    const response = await customAxios.get(API_ROUTES.SESSION_DEFINTIONS);
    definitions = response;

    return definitions;
  },
  status: () => ({ ...sessionStorageStatus, id: sessionId }),
  plugins: {
    get: () => ({ ...sessionPlugins }),
    set: async (type: PluginTypes, ids: string[], groupId?: string) => {
      if (type === PluginTypes.Point) {
        if (!groupId) {
          throw 'groupId is required';
        }

        sessionPlugins[type][groupId!] = (await pluginsManager.definitions()).filter(plugin => {
          return plugin.data.type === type && ids.includes(plugin._id);
        });
      } else {
        sessionPlugins[type] = (await pluginsManager.definitions()).filter(plugin => {
          return plugin.data.type === type && ids.includes(plugin._id);
        });
      }

      await sessionManager.index();
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
  },
  delete: async (id: string) => {
    await customAxios.get(API_ROUTES.SESSION_DELETE, { params: { id } });

    if (id === sessionId) {
      await sessionManager.reset();
      location.reload();
    }
  }
};
