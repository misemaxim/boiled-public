import PouchDB from 'pouchdb';
import { ByPass, DeviceStorageItemDecrypted, DeviceStorageItemEncrypted } from '../../types';
import { getAppConfig } from './get-app-config';
import { showMessage } from '../interface/show-message';

export const DEVICE_STORAGE_ID = '_boiled-device-storage';
export const ENTRY_EXPIRATION = 3 * 60 * 60 * 1000;

function arrayBufferToString(arrayBuffer: ArrayBuffer): string {
  return String.fromCharCode.apply(null, new Uint16Array(arrayBuffer) as unknown as number[]);
}

function stringToArrayBuffer(string: string): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(string.length * 2);
  const arrayBuffer16 = new Uint16Array(arrayBuffer);
  string.split('').forEach((char, index) => {
    arrayBuffer16[index] = string.charCodeAt(index);
  });

  return arrayBuffer;
}

export class DeviceStorage {
  private db: PouchDB.Database;
  private hashKey: string;
  private encryptionMode: string;

  constructor() {
    this.db = new PouchDB(DEVICE_STORAGE_ID);
    this.hashKey = '';
    this.encryptionMode = 'AES-CBC';
  }

  private generateKey = async (): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const hashKeyPhrase = [
      ...new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(getAppConfig().username)))
    ].map(x => x.toString(16).padStart(2, '0')).join('');
    this.hashKey = hashKeyPhrase.toString().slice(0, 43);

    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: 'oct', k: this.hashKey, alg: 'A256CBC', ext: true },
      { name: this.encryptionMode },
      false,
      ['encrypt', 'decrypt']
    );

    return key;
  };

  private generateIv = (randomness: number): Uint8Array => {
    return (
      new TextEncoder().encode(
        [this.hashKey.slice(0, 8), randomness.toString().split('').join(''), this.hashKey.slice(-8)].join('')
      )
    ).slice(0, 16);
  };

  private encrypt = async (data: string, stamp: number): Promise<string> => {
    const key = await this.generateKey();

    const stringifiedData = JSON.stringify(data);
    const dataBuffer = stringToArrayBuffer(stringifiedData);
    const iv = this.generateIv(stamp);

    const encryptedDataBuffer = await crypto.subtle.encrypt(
      { name: this.encryptionMode, iv },
      key,
      dataBuffer
    );

    return arrayBufferToString(encryptedDataBuffer);
  };

  private decrypt = async (data: string, stamp: number) => {
    const key = await this.generateKey();

    const dataBuffer = stringToArrayBuffer(data);
    const iv = this.generateIv(stamp);

    const decryptedDataBuffer = await crypto.subtle.decrypt(
      { name: this.encryptionMode, iv },
      key,
      dataBuffer
    );

    return JSON.parse(arrayBufferToString(decryptedDataBuffer));
  };

  public set = async (item: DeviceStorageItemDecrypted): Promise<void> => {
    const prepared = {
      ...item,
      _rev: item.timestamp + '',
      data: await this.encrypt(JSON.stringify(item.data), item.timestamp)
    } as DeviceStorageItemEncrypted;

    await this.db.put(prepared, { force: true });
  };

  public get = async (_id: string): Promise<DeviceStorageItemDecrypted | null> => {
    try {
      const item: DeviceStorageItemEncrypted = await this.db.get(_id);

      const prepared: DeviceStorageItemDecrypted = {
        ...item,
        data: JSON.parse(await this.decrypt(item.data, item.timestamp))
      };

      if (prepared.timestamp + ENTRY_EXPIRATION < Date.now()) {
        return null;
      }

      return prepared;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      if (
        (error as ByPass).status !== 404 &&
        (error as ByPass).name !== 'OperationError'
      ) {
        showMessage(error.toString());
      }

      return null;
    }
  };

  public async reset(): Promise<void> {
    await this.db.destroy();
    this.db = new PouchDB(DEVICE_STORAGE_ID);
  }
}
