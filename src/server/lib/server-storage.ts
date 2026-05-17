import PouchDB from 'pouchdb';
import {
  API_ERRORS,
  ByPass,
  PluginDefinition,
  PluginSchemaRaw,
  ServerStorageItem,
  SessionDefinition,
  SessionSchema,
  UserSchema,
  USER_TYPES
} from '../../types';
import { nanoid } from 'nanoid';
import { hashService } from './hash-service';

export enum ServerStorageIds {
  SessionDefinition = 'storage-session-definition',
  SessionData = 'storage-session-data',
  PluginDefinition = 'storage-plugin-definition',
  PluginData = 'storage-plugin-data',
  AppSetup = 'storage-app-setup',
  Users = 'storage-users'
}

class ServerStorage {
  private dbs: Record<ServerStorageIds, PouchDB.Database>;

  constructor() {
    this.dbs = Object.values(ServerStorageIds).reduce((dbs, id) => {
      // eslint-disable-next-line camelcase
      dbs[id] = new PouchDB(id, { revs_limit: 1, auto_compaction: true });
      return dbs;
    }, {} as Record<ServerStorageIds, PouchDB.Database>);
  }

  private set = async <T>(db: ServerStorageIds, item: ServerStorageItem<T>): Promise<void> => {
    await this.dbs[db].put({ ...item, _rev: item.timestamp + '' }, { force: true });
  };

  private get = async <T>(db: ServerStorageIds, _id: string): Promise<ServerStorageItem<T> | null> => {
    try {
      const item: ServerStorageItem<T> = await this.dbs[db].get(_id);

      return item;
    } catch (error) {
      if ((error as ByPass).status !== 404) {
        throw error;
      }

      return null;
    }
  };

  private reset = async () => {
    for (const [id, db] of Object.entries(this.dbs)) {
      await db.destroy();
      // eslint-disable-next-line camelcase
      this.dbs[id] = new PouchDB(id, { revs_limit: 1, auto_compaction: true });

      const docs = await this.dbs[ServerStorageIds.SessionDefinition].allDocs();
      for (const row of docs.rows) {
        await this.delete(id as ServerStorageIds, row.id);
      }
    }
  };

  private delete = async (db: ServerStorageIds, _id: string): Promise<void> => {
    try {
      await this.set(db, { _id, data: {}, timestamp: Date.now() });
      // eslint-disable-next-line camelcase
      const leaves = await this.dbs[db].get<ServerStorageItem<unknown>>(_id, { open_revs: 'all' });

      for (const leaf of leaves) {
        if (leaf.ok && !leaf.ok._deleted) {
          await this.dbs[db].remove(leaf.ok);
        }
      }
    } catch (error) {
      if ((error as ByPass).status !== 404) {
        throw error;
      }
    }
  };

  public session = {
    create: async (data: SessionSchema) => {
      const item: ServerStorageItem<SessionSchema> = {
        _id: 'session_' + nanoid(16),
        timestamp: Date.now(),
        data
      };

      await Promise.all([
        this.set(ServerStorageIds.SessionData, item),
        this.set(ServerStorageIds.SessionDefinition, {
          _id: item._id,
          timestamp: item.timestamp,
          data: {
            name: item.data.name,
            created: item.timestamp
          }
        } as ServerStorageItem<SessionDefinition>)
      ]);

      return item._id;
    },
    update: async (_id: string, data: SessionSchema) => {
      const session = await this.get<SessionSchema>(ServerStorageIds.SessionData, _id);
      if (!session) {
        throw '';
      }

      const item: ServerStorageItem<SessionSchema> = {
        _id,
        timestamp: Date.now(),
        data
      };

      await this.set(ServerStorageIds.SessionData, item);
    },
    get: async (_id: string) => {
      return this.get<SessionSchema>(ServerStorageIds.SessionData, _id);
    },
    definitions: async (): Promise<ServerStorageItem<SessionDefinition>[]> => {
      const definitions = await this.dbs[ServerStorageIds.SessionDefinition]
      // eslint-disable-next-line camelcase
        .allDocs<ServerStorageItem<SessionDefinition>>({ include_docs: true });

      return definitions.rows.map(row => row.doc).filter(row => row.data);
    },
    delete: async (_id: string) => {
      await Promise.all([
        this.delete(ServerStorageIds.SessionDefinition, _id),
        this.delete(ServerStorageIds.SessionData, _id)
      ]);
    }
  };

  public plugin = {
    create: async (data: PluginSchemaRaw) => {
      const item: ServerStorageItem<PluginSchemaRaw> = {
        _id: 'plugin_' + nanoid(16),
        timestamp: Date.now(),
        data
      };

      await Promise.all([
        this.set(ServerStorageIds.PluginData, item),
        this.set(ServerStorageIds.PluginDefinition, {
          _id: item._id,
          timestamp: item.timestamp,
          data: {
            name: item.data.name,
            type: item.data.type,
            created: item.timestamp
          }
        } as ServerStorageItem<PluginDefinition>)
      ]);

      return item._id;
    },
    update: async (_id: string, data: PluginSchemaRaw) => {
      const item: ServerStorageItem<PluginSchemaRaw> = {
        _id,
        timestamp: Date.now(),
        data
      };

      await this.set(ServerStorageIds.PluginData, item);
    },
    get: async (_id: string) => {
      return this.get<PluginSchemaRaw>(ServerStorageIds.PluginData, _id);
    },
    definitions: async (): Promise<ServerStorageItem<PluginDefinition>[]> => {
      const definitions = await this.dbs['storage-plugin-definition']
      // eslint-disable-next-line camelcase
        .allDocs<ServerStorageItem<PluginDefinition>>({ include_docs: true });

      return definitions.rows.map(row => row.doc).filter(row => row.data);
    },
    delete: async (_id: string) => {
      await Promise.all([
        this.delete(ServerStorageIds.PluginDefinition, _id),
        this.delete(ServerStorageIds.PluginData, _id)
      ]);
    }
  };

  private allUsers = async (): Promise<ServerStorageItem<UserSchema>[]> => {
    const definitions = await this.dbs[ServerStorageIds.Users]
    // eslint-disable-next-line camelcase
      .allDocs<ServerStorageItem<UserSchema>>({ include_docs: true });

    return definitions.rows.map(row => row.doc).filter(row => row.data);
  };
  public users = {
    create: async (type: USER_TYPES, username: string, password: string) => {
      const usernameRegex = /^[A-Za-z0-9]+$/;
      const validUsername = usernameRegex.test(username);
      if (!validUsername) {
        throw new Error(API_ERRORS.INVALID_USERNAME);
      }

      const salt = nanoid(32);
      const item: ServerStorageItem<UserSchema> = {
        _id: 'user_' + nanoid(16),
        timestamp: Date.now(),
        data: {
          username,
          signature: await hashService.get(password, salt),
          salt,
          type
        }
      };

      const existing = (await this.allUsers()).find(user => user.data.username === username);
      if (existing) {
        throw new Error(API_ERRORS.USER_EXISTS);
      }

      await this.set(ServerStorageIds.Users, item);

      return item._id;
    },
    update: async (username: string, data: UserSchema) => {
      const user = await this.users.get(username);

      const item: ServerStorageItem<UserSchema> = {
        _id: user!._id,
        timestamp: Date.now(),
        data: {
          ...data,
          username
        }
      };

      await this.set(ServerStorageIds.Users, item);
    },
    get: async (username: string) => {
      return (await this.allUsers()).find(user => user.data.username === username);
    },
    getSuperUser: async () => {
      return (await this.allUsers()).find(user => user.data.type === USER_TYPES.SUPER);
    },
    delete: async (username: string) => {
      const user = await this.users.get(username);
      await this.delete(ServerStorageIds.Users, user!._id);
    }
  };
}

export const serverStorage = new ServerStorage();
