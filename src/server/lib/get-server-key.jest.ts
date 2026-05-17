import { getServerKey } from './get-server-key';
import fs from 'fs';
import { nanoid } from 'nanoid';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  writeFileSync: jest.fn()
}));

describe('getServerKey', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should check key file', () => {
    getServerKey();

    expect(fs.existsSync).toBeCalledTimes(1);
    expect(fs.existsSync).toHaveBeenCalledWith('server.key');
  });

  test('should return existing server key', () => {
    const key = nanoid(32);

    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(key);

    expect(getServerKey()).toBe(key);

    expect(fs.readFileSync).toBeCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledWith('server.key', 'utf8');
  });

  test('should create new server key and return it if key file is missing', () => {
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

    const key = getServerKey();
    expect(key).toHaveLength(32);

    expect(fs.writeFileSync).toBeCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith('server.key', key, 'utf8');
  });

  test('should create new server key and return it if key file has no key', () => {
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
    (fs.readFileSync as jest.Mock).mockReturnValueOnce('       ');

    const key = getServerKey();
    expect(key).toHaveLength(32);

    expect(fs.writeFileSync).toBeCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith('server.key', key, 'utf8');
  });
});
