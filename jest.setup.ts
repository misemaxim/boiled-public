import { ByPass, DeviceStorageItemDecrypted, ServerStorageItem } from './src/types';
import { mockSessionManager } from './tests/mock-session-manager';

jest.useFakeTimers().setSystemTime(new Date('2023-10-10'));

// jest.mock('./src/server/services/appConfig', () => ({
//   appConfig: jest.fn().mockReturnValue({})
// }));

jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: {} }),
  get: jest.fn().mockResolvedValue({ data: {} }),
  head: jest.fn().mockResolvedValue({ data: {} })
}));

jest.mock('./src/public/lib/get-app-config.ts', () => ({
  getAppConfig: jest.fn().mockReturnValue({
    username: 'someone',
    config: {
      layers: {
        enableDefault: true,
        customLayers: [],
        enableSatellite: true
      }
    }
  })
}));

jest.mock('./src/public/interface/show-message', () => ({
  showMessage: jest.fn()
}));

const mockDatabase: Record<string, Record<string, DeviceStorageItemDecrypted>> = {};
jest.mock('./src/public/lib/device-storage', () => ({
  DeviceStorage: class {
    private dataId: string;

    public constructor(dataId: string) {
      this.dataId = dataId;
      mockDatabase[this.dataId] = {};
    }

    public async set(item: DeviceStorageItemDecrypted): Promise<void> {
      return await new Promise(resolve => {
        mockDatabase[this.dataId][item._id] = item;
        resolve();
      });
    }

    public async get(_id: string): Promise<DeviceStorageItemDecrypted | null> {
      return await new Promise(resolve => {
        const entry = mockDatabase[this.dataId][_id];
        resolve(entry);
      });
    }

    public async reset(): Promise<void> {
      return await new Promise(resolve => {
        mockDatabase[this.dataId] = {};
        resolve();
      });
    }
  }
}));

jest.mock('./src/public/lib/session-manager', () => ({ sessionManager: mockSessionManager }));

export let mockServerDatabase: Record<string, Record<string, ServerStorageItem<ByPass>>> = {};
jest.mock('pouchdb', () => class {
  private dataId: string;

  public constructor(dataId: string) {
    this.dataId = dataId;
  }

  public async put(item: ServerStorageItem<unknown>): Promise<ByPass> {
    return await new Promise(resolve => {
      if (!mockServerDatabase[this.dataId]) {
        mockServerDatabase[this.dataId] = {};
      }

      mockServerDatabase[this.dataId][item._id] = item;
      resolve(item._id);
    });
  }

  public async get(
    id: string,
    options?: PouchDB.Core.GetOpenRevisions
  ): Promise<ServerStorageItem<ByPass> | { ok: ServerStorageItem<ByPass> }[] | undefined> {
    return await new Promise(resolve => {
      if (!mockServerDatabase[this.dataId]) {
        mockServerDatabase[this.dataId] = {};
      }

      const entry = mockServerDatabase[this.dataId][id];
      if (!entry) {
        throw { status: 404 };
      }

      if (options?.open_revs === 'all') {
        resolve([{ ok: entry }]);
      } else {
        if (entry._deleted) {
          resolve(undefined);
        }

        resolve(entry);
      }
    });
  }

  public async remove(doc: ServerStorageItem<ByPass>): Promise<void> {
    return await new Promise(resolve => {
      if (!mockServerDatabase[this.dataId]) {
        mockServerDatabase[this.dataId] = {};
      }

      mockServerDatabase[this.dataId][doc._id] = {
        _id: doc._id,
        _deleted: true,
        data: mockServerDatabase[this.dataId][doc._id].data,
        timestamp: Date.now()
      };

      resolve();
    });
  }

  public async allDocs(options: PouchDB.Core.AllDocsOptions) {
    if (!options.include_docs) {
      throw { status: 500 };
    }

    if (!mockServerDatabase[this.dataId]) {
      mockServerDatabase[this.dataId] = {};
    }

    return {
      rows: Object.values(mockServerDatabase[this.dataId]).map(doc => ({
        doc
      }))
    };
  }
});

jest.mock('./src/server/lib/get-config', () => ({
  getConfig: jest.fn(() => ({
    serverKey: 'server-key-----1234566789',
    superUser: 'user123',
    app: {
      layers: {
        enableDefault: true,
        customLayers: [],
        enableSatellite: true
      },
      public: {
        enabled: true,
        sessionId: 'public-session',
        layers: [{ name: 'Layer A', url: 'https://web1.com/tile/{z}/{y}/{x}', attribution: 'Copyright 1' }],
        message: 'Disclaimer'
      }
    }
  }))
}));

jest.mock('./src/server/lib/validate-operation', () => ({
  validateOperation: jest.fn(() => Promise.resolve('someone'))
}));

beforeEach(() => {
  mockServerDatabase = {};
});
