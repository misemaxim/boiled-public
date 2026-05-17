import { API_ROUTES, PluginDefinition, PluginSchemaRaw, PluginTypes, ServerStorageItem } from '../../../../../types';
import { overlayManager } from '../../../../lib/overlay-manager';
import { sessionManager } from '../../../../lib/session-manager';
import { eventsScope } from '../../mapping/lib/map-events';
import { mapContext } from '../../mapping/lib/map-service';
import { customAxios } from '../../../../lib/custom-axios';
import { evaluatePluginScript, PossiblePluginScope } from './evalulate-plugin-script';
import { showMessage } from '../../../../interface/show-message';
import { pick } from 'lodash';

let definitions: ServerStorageItem<PluginDefinition>[] = [];
let loadedPlugins: Record<string, PluginSchemaRaw> = {};

export const pluginsManager = {
  clearCache: () => {
    definitions = [];
    loadedPlugins = {};
  },
  export: async (id: string) => {
    const plugin = await pluginsManager.load(id);
    const data = new Blob([JSON.stringify(plugin)], { type: 'text/plain' });
    const textFile = window.URL.createObjectURL(data);

    const link = document.createElement('a');
    link.setAttribute('download', plugin.name + '.boiledapp');
    link.href = textFile;
    document.body.appendChild(link);

    window.requestAnimationFrame(() => {
      const event = new MouseEvent('click');
      link.dispatchEvent(event);
      document.body.removeChild(link);
    });
  },
  save: async (plugin: PluginSchemaRaw, id?: string) => {
    if (id) {
      await customAxios.post(API_ROUTES.PLUGIN_UPDATE, plugin, { params: { id } });
      showMessage('Current Plugin Is Saved');
      loadedPlugins[id] = plugin;
    } else {
      const response = await customAxios.post(API_ROUTES.PLUGIN_CREATE, plugin);
      showMessage('Current Plugin Is Saved');
      const id = response;
      const uiTimestamp = Date.now();
      definitions.push({
        _id: id,
        data: {
          name: plugin.name,
          type: plugin.type,
          created: uiTimestamp
        },
        timestamp: uiTimestamp
      });
      loadedPlugins[id] = plugin;

      return id;
    }
  },
  load: async (id: string): Promise<PluginSchemaRaw> => {
    if (loadedPlugins[id]) {
      return loadedPlugins[id];
    }

    const response = await customAxios.get(API_ROUTES.PLUGIN_GET, { params: { id } });
    loadedPlugins[id] = response.data;

    return loadedPlugins[id];
  },
  definitions: async (): Promise<ServerStorageItem<PluginDefinition>[]> => {
    if (definitions.length) {
      return definitions;
    }

    const response = await customAxios.get(API_ROUTES.PLUGIN_DEFINTIONS);
    definitions = response;

    return definitions;
  },
  evaluate: async (id: string): Promise<void> => {
    const plugin = await pluginsManager.load(id);
    const session = sessionManager.get();
    const context = pick(mapContext, [
      'initializing',
      'methods',
      'groups',
      'points',
      'map'
    ]) as PossiblePluginScope['context'];

    if (!plugin) {
      showMessage('Error on invoking plugin: No Plugin found');
      return;
    }

    let scope: PossiblePluginScope = {};
    if (plugin.type === PluginTypes.Coordinates) {
      scope = {
        coordinates: eventsScope.savedCoordinates,
        session: sessionManager.get(),
        context
      };
    }

    if (plugin.type === PluginTypes.Search) {
      const query = (await overlayManager.open('pluginSearch', { label: plugin.name })) as string;

      scope = {
        query,
        session,
        context
      };
    }

    if (plugin.type === PluginTypes.Point) {
      const point = eventsScope.pointData;
      const group = session.groups.find(group => group.id === point.group);

      scope = {
        point,
        group,
        session,
        context
      };
    }

    if (plugin.type === PluginTypes.Refresh) {
      scope = {
        session,
        context
      };
    }

    if (plugin.type === PluginTypes.Search && !scope.query) {
      return;
    }

    await evaluatePluginScript(plugin.script, scope);
  },
  delete: async (id: string) => {
    await customAxios.get(API_ROUTES.PLUGIN_DELETE, { params: { id } });
  }
};
