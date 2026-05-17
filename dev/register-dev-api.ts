import { Application } from 'express';
import { respond } from '../src/server/lib/respond';
import { serverStorage } from '../src/server/lib/server-storage';
import { ByPass, PluginSchemaRaw, SessionSchema, SessionSchemaDev, USER_TYPES } from '../src/types';
import sessionData from './data/session.json';
import searchPluginData from './data/plugin-search.json';
import coordinatesPluginData from './data/plugin-coordinates.json';
import refreshPluginData from './data/plugin-refresh.json';
import pointPluginData from './data/plugin-point.json';
import { getConfig } from '../src/server/lib/get-config';

export const registerDevApi = (app: Application) => {
  app.get('/dev/api/storage-reset', async (req, res) => {
    try {
      await (serverStorage as ByPass).reset();

      respond(req, res, null);
    } catch (error) {
      respond(req, res, null, error);
    }
  });

  app.get('/dev/api/storage-create', async (req, res) => {
    try {
      const searchPluginId = await serverStorage.plugin.create(searchPluginData as PluginSchemaRaw);
      const coordinatesPluginId = await serverStorage.plugin.create(coordinatesPluginData as PluginSchemaRaw);
      const refreshPluginId = await serverStorage.plugin.create(refreshPluginData as PluginSchemaRaw);
      const pointPluginDataId = await serverStorage.plugin.create(pointPluginData as PluginSchemaRaw);
      (sessionData as SessionSchemaDev).groups[0].plugins = [pointPluginDataId];

      await serverStorage.session.create({
        ...sessionData,
        plugins: [
          searchPluginId,
          coordinatesPluginId,
          refreshPluginId
        ]
      } as SessionSchemaDev as SessionSchema);

      await serverStorage.users.create(USER_TYPES.SUPER, getConfig().superUser, 'password');

      respond(req, res, null);
    } catch (error) {
      respond(req, res, null, error);
    }
  });
};
