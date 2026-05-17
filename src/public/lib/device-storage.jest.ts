import { omit } from 'lodash';
import { DeviceStorage, ENTRY_EXPIRATION } from './device-storage';
import { webcrypto } from 'crypto';
import { TextEncoder, TextDecoder } from 'util';
import { DeviceStorageItemEncrypted, SessionSchema } from '../../types';


const mockDatabase: Record<string, Record<string, DeviceStorageItemEncrypted>> = {};

jest.mock('./device-storage', () => ({
  ...jest.requireActual('./device-storage')
}));
jest.mock('pouchdb', () => class {
  private dataId: string;

  public constructor(dataId: string) {
    this.dataId = dataId;
    mockDatabase[this.dataId] = {};
  }

  public async put(item: DeviceStorageItemEncrypted): Promise<unknown> {
    return await new Promise(resolve => {
      mockDatabase[this.dataId][item._id] = item;
      resolve(item._id);
    });
  }

  public async get(id: string): Promise<DeviceStorageItemEncrypted> {
    return await new Promise(resolve => {
      const entry = mockDatabase[this.dataId][id];
      if (!entry) {
        throw { status: 404 };
      }

      resolve(entry);
    });
  }
});

describe('DeviceStorage', () => {
  // @ts-ignore
  window.crypto = webcrypto;
  // @ts-ignore
  window.TextEncoder = TextEncoder;
  // @ts-ignore
  window.TextDecoder = TextDecoder;

  const testEntry = {
    _id: '1-1',
    data: {
      id: '1',
      data: {
        name: 'test-entry'
      } as SessionSchema
    },
    timestamp: 123
  };

  let deviceStorage: DeviceStorage;

  beforeEach(() => {
    Date.now = () => ENTRY_EXPIRATION;

    deviceStorage = new DeviceStorage();
  });

  test('should set encrypted entry in database', async () => {
    await deviceStorage.set(testEntry);

    expect(mockDatabase).toEqual({
      '_boiled-device-storage': {
        '1-1': {
          _id: '1-1',
          data: '\ud902뜷늾䞔턏Ｕ璥㉭ຊ㟖ꠎ宅흞㔐מּỀ犣遞彾⑴㿳챁殖鄀ܾݣ\ud811獭ᙚ䙪ﷀ乵뺮粗Ⴭ᎔覣㊉᜝\udd2a𵛔Ⱕ嶙ꗓ叒⧑㫅㆙萴ݒ',
          timestamp: 123,
          _rev: '123'
        }
      }
    });
  });

  test('should return decrypted entry from database', async () => {
    await deviceStorage.set(testEntry);
    const entryFromDatabase = await deviceStorage.get(testEntry._id);

    expect(omit(entryFromDatabase, '_rev')).toEqual(testEntry);
  });

  test('should return null if entry in database is old', async () => {
    Date.now = () => ENTRY_EXPIRATION * 2;

    await deviceStorage.set(testEntry);
    const entryFromDatabase = await deviceStorage.get(testEntry._id);

    expect(entryFromDatabase).toBe(null);
  });

  test('should return null if entry in database is not found', async () => {
    const entryFromDatabase = await deviceStorage.get(testEntry._id);

    expect(entryFromDatabase).toBe(null);
  });
});
