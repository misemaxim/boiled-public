import { API_ERRORS, ByPass, PluginSchemaRaw, PluginTypes, SessionSchema, SessionSchemaDev, USER_TYPES } from '../../types';
import testSession from '../../../tests/test-session.json';
import { serverStorage, ServerStorageIds } from './server-storage';
import { hashService } from './hash-service';
import { mockServerDatabase } from '../../../jest.setup';

describe('serverStorage', () => {
  describe('.session', () => {
    let session: SessionSchema;

    beforeEach(() => {
      session = { ...testSession } as SessionSchemaDev as SessionSchema;
    });

    describe('.create', () => {
      test('should add given session to the storage', async () => {
        const id = await serverStorage.session.create(session);

        const sessionData = mockServerDatabase[ServerStorageIds.SessionData][id];
        const sessionDefinition = mockServerDatabase[ServerStorageIds.SessionDefinition][id];

        expect(sessionDefinition._id).toBe(id);
        expect(sessionDefinition.data.name).toBe('890');
        expect(typeof sessionDefinition.timestamp).toBe('number');
        expect(sessionDefinition.data.created).toBe(sessionDefinition.timestamp);
        expect(sessionDefinition._rev).toBe(sessionDefinition.timestamp + '');

        expect(sessionData._id).toBe(id);
        expect(typeof sessionData.timestamp).toBe('number');
        expect(sessionData.data).toEqual(session);
        expect(sessionData._rev).toBe(sessionData.timestamp + '');
      });
    });

    describe('.update', () => {
      test('should update given session in the storage', async () => {
        const id = await serverStorage.session.create(session);

        expect(mockServerDatabase[ServerStorageIds.SessionData][id].data.points).not.toEqual({});

        await serverStorage.session.update(id, { ...session, points: {} });

        expect(mockServerDatabase[ServerStorageIds.SessionData][id].data.points).toEqual({});
      });
    });

    describe('.get', () => {
      test('should return session from the storage', async () => {
        const id = await serverStorage.session.create(session);
        const sessionData = (await serverStorage.session.get(id))!;

        expect(sessionData._id).toBe(id);
        expect(typeof sessionData.timestamp).toBe('number');
        expect(sessionData.data).toEqual(session);
        expect(sessionData._rev).toBe(sessionData.timestamp + '');
      });
    });

    describe('.definitions', () => {
      test('should list session definitions', async () => {
        const [id1, id2] = await Promise.all([
          serverStorage.session.create(session),
          serverStorage.session.create({ ...session, name: session.name + '-new' })
        ]);

        const definitions = await serverStorage.session.definitions();

        expect(definitions[0]._id).toBe(id1);
        expect(definitions[0].data.name).toBe('890');
        expect(typeof definitions[0].timestamp).toBe('number');
        expect(definitions[0].data.created).toBe(definitions[0].timestamp);
        expect(definitions[0]._rev).toBe(definitions[0].timestamp + '');

        expect(definitions[1]._id).toBe(id2);
        expect(definitions[1].data.name).toBe('890-new');
        expect(typeof definitions[1].timestamp).toBe('number');
        expect(definitions[1].data.created).toBe(definitions[1].timestamp);
        expect(definitions[1]._rev).toBe(definitions[1].timestamp + '');
      });
    });

    describe('.delete', () => {
      test('should delete session', async () => {
        const id = await serverStorage.session.create(session);
        await serverStorage.session.delete(id);

        const sessionDefinition = (await serverStorage.session.get(id))!;
        const sessionData = (await serverStorage.session.get(id))!;
        expect(sessionDefinition).toBe(undefined);
        expect(sessionData).toBe(undefined);
        expect(mockServerDatabase[ServerStorageIds.SessionDefinition][id].data).toEqual({});
        expect(mockServerDatabase[ServerStorageIds.SessionData][id].data).toEqual({});
      });
    });
  });

  describe('.plugin', () => {
    let plugin: PluginSchemaRaw;

    beforeEach(() => {
      plugin = {
        type: PluginTypes.Coordinates,
        name: 'Created',
        script: 'SCRIPT-BODY'
      };
    });

    describe('.create', () => {
      test('should add given plugin to the storage', async () => {
        const id = await serverStorage.plugin.create(plugin);

        const pluginData = mockServerDatabase[ServerStorageIds.PluginData][id];
        const pluginDefinition = mockServerDatabase[ServerStorageIds.PluginDefinition][id];

        expect(pluginDefinition._id).toBe(id);
        expect(pluginDefinition.data.name).toBe('Created');
        expect(typeof pluginDefinition.timestamp).toBe('number');
        expect(pluginDefinition.data.created).toBe(pluginDefinition.timestamp);
        expect(pluginDefinition._rev).toBe(pluginDefinition.timestamp + '');

        expect(pluginData._id).toBe(id);
        expect(typeof pluginData.timestamp).toBe('number');
        expect(pluginData.data).toEqual(plugin);
        expect(pluginData._rev).toBe(pluginData.timestamp + '');
      });
    });

    describe('.update', () => {
      test('should update given plugin in the storage', async () => {
        const id = await serverStorage.plugin.create(plugin);

        expect(mockServerDatabase[ServerStorageIds.PluginData][id].data.name).toBe('Created');

        await serverStorage.plugin.update(id, { ...plugin, name: 'Updated' });

        expect(mockServerDatabase[ServerStorageIds.PluginData][id].data.name).toBe('Updated');
      });
    });

    describe('.get', () => {
      test('should return plugin from the storage', async () => {
        const id = await serverStorage.plugin.create(plugin);
        const pluginData = (await serverStorage.plugin.get(id))!;

        expect(pluginData._id).toBe(id);
        expect(typeof pluginData.timestamp).toBe('number');
        expect(pluginData.data).toEqual(plugin);
        expect(pluginData._rev).toBe(pluginData.timestamp + '');
      });
    });

    describe('.definitions', () => {
      test('should list plugin definitions', async () => {
        const [id1, id2] = await Promise.all([
          serverStorage.plugin.create(plugin),
          serverStorage.plugin.create({ ...plugin, name: plugin.name + '-new' })
        ]);

        const definitions = await serverStorage.plugin.definitions();

        expect(definitions[0]._id).toBe(id1);
        expect(definitions[0].data.name).toBe('Created');
        expect(typeof definitions[0].timestamp).toBe('number');
        expect(definitions[0].data.created).toBe(definitions[0].timestamp);
        expect(definitions[0]._rev).toBe(definitions[0].timestamp + '');

        expect(definitions[1]._id).toBe(id2);
        expect(definitions[1].data.name).toBe('Created-new');
        expect(typeof definitions[1].timestamp).toBe('number');
        expect(definitions[1].data.created).toBe(definitions[1].timestamp);
        expect(definitions[1]._rev).toBe(definitions[1].timestamp + '');
      });
    });

    describe('.delete', () => {
      test('should delete plugin', async () => {
        const id = await serverStorage.plugin.create(plugin);
        await serverStorage.plugin.delete(id);

        const pluginDefinition = (await serverStorage.plugin.get(id))!;
        const pluginData = (await serverStorage.plugin.get(id))!;
        expect(pluginDefinition).toBe(undefined);
        expect(pluginData).toBe(undefined);
        expect(mockServerDatabase[ServerStorageIds.PluginDefinition][id].data).toEqual({});
        expect(mockServerDatabase[ServerStorageIds.PluginData][id].data).toEqual({});
      });
    });
  });

  describe('.users', () => {
    describe('.create', () => {
      test('should create new user', async () => {
        await serverStorage.users.create(USER_TYPES.ADMIN, 'someone', 'pass-123');
        const userData = (await serverStorage.users.get('someone'))!;

        expect(typeof userData.timestamp).toBe('number');
        expect(userData.data.type).toBe(USER_TYPES.ADMIN);
        expect(userData.data.username).toBe('someone');
        expect(typeof userData.data.salt).toBe('string');
        expect(await hashService.verify(userData.data.signature, 'pass-123', userData.data.salt)).toBe(true);
        expect(userData._rev).toBe(userData.timestamp + '');
      });

      test('should not allow to create user with same username', async () => {
        await serverStorage.users.create(USER_TYPES.ADMIN, 'someone', 'pass-123');

        let catchError = '';
        try {
          await serverStorage.users.create(USER_TYPES.ADMIN, 'someone', 'pass-123');
        } catch (error) {
          catchError = (error as ByPass).toString();
        }

        expect(catchError).toContain(API_ERRORS.USER_EXISTS);
      });
    });

    describe('.update', () => {
      test('should update user data', async () => {
        await serverStorage.users.create(USER_TYPES.ADMIN, 'someone', 'pass-123');
        const userData1 = (await serverStorage.users.get('someone'))!;

        expect(userData1.data.cookie).toBe(undefined);

        await serverStorage.users.update('someone', {
          ...userData1.data,
          cookie: {
            value: 'TOKEN',
            maxAge: 123
          }
        });
        const userData2 = (await serverStorage.users.get('someone'))!;

        expect(userData2.data).toEqual({
          ...userData1.data,
          cookie: {
            value: 'TOKEN',
            maxAge: 123
          }
        });
      });

      test('should not allow overwrite username', async () => {
        await serverStorage.users.create(USER_TYPES.ADMIN, 'someone', 'pass-123');
        const userData1 = (await serverStorage.users.get('someone'))!;

        expect(userData1.data.username).toBe('someone');

        await serverStorage.users.update('someone', {
          ...userData1.data,
          username: 'unknown'
        });
        const userData2 = (await serverStorage.users.get('someone'))!;

        expect(userData2.data.username).toBe('someone');
      });
    });

    describe('.get', () => {
      test('should return user from the storage', async () => {
        await Promise.all([
          serverStorage.users.create(USER_TYPES.ADMIN, 'someone1', 'pass-123'),
          serverStorage.users.create(USER_TYPES.CREATOR, 'someone2', 'pass-456')
        ]);

        const userData1 = (await serverStorage.users.get('someone1'))!;

        expect(userData1.data.username).toBe('someone1');
        expect(userData1.data.type).toBe(USER_TYPES.ADMIN);

        const userData2 = (await serverStorage.users.get('someone2'))!;

        expect(userData2.data.username).toBe('someone2');
        expect(userData2.data.type).toBe(USER_TYPES.CREATOR);
      });
    });

    describe('.delete', () => {
      test('should delete user', async () => {
        const id = await serverStorage.users.create(USER_TYPES.ADMIN, 'someone', 'pass-123');

        await serverStorage.users.delete('someone');

        const userData = (await serverStorage.users.get('someone'))!;
        expect(userData).toBe(undefined);
        expect(mockServerDatabase[ServerStorageIds.Users][id].data).toEqual({});
      });
    });
  });
});
