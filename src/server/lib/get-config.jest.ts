import { getConfig } from './get-config';
import fs from 'fs';

jest.mock('fs', () => ({
  readFileSync: jest.fn(() => '')
}));
jest.mock('./get-config', () => ({
  ...jest.requireActual('./get-config')
}));
jest.mock('./get-server-key', () => ({
  getServerKey: () => 'server-key-456'
}));

describe('getConfig', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should read config file', () => {
    getConfig();

    expect(fs.readFileSync).toBeCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledWith('config.toml', 'utf8');
  });

  test('should get values from config file', () => {
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(`
      superUser="someone"

      [app.layers]
      enableDefault=false
      customLayers=[
        { name="Layer A", url="https://web1.com/tile/{z}/{y}/{x}", attribution="Copyright 1" },
        { name="Layer B", url="https://web2.com/tile/{z}/{y}/{x}", attribution="Copyright 2" }
      ]
      enableSatellite=false

      [app.public]
      enabled=true
      sessionId="DzfPJsqWCOmmyT04"
      layers=[
        { name="Layer A", url="https://web1.com/tile/{z}/{y}/{x}", attribution="Copyright 1" },
      ]
      message="This Is Public"
    `);

    const config = getConfig();

    expect(config.superUser).toBe('someone');
    expect(config.app.layers.customLayers).toHaveLength(2);
    expect(config.app.layers.enableDefault).toBe(false);
    expect(config.app.layers.enableSatellite).toBe(false);

    expect(config.app.public.enabled).toBe(true);
    expect(config.app.public.sessionId).toBe('DzfPJsqWCOmmyT04');
    expect(config.app.public.layers).toHaveLength(1);
    expect(config.app.public.message).toBe('This Is Public');
  });

  test('should set default values for non-configured properties', () => {
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(`
      [app.layers]
      enableSatellite=false

      [app.public]
      layers=[
        { name="Layer A", url="https://web1.com/tile/{z}/{y}/{x}", attribution="Copyright 1" },
      ]
      message="This Is Public"
    `);

    const config = getConfig();

    expect(config.superUser).toBe('');
    expect(config.app.layers.customLayers).toHaveLength(0);
    expect(config.app.layers.enableDefault).toBe(true);
    expect(config.app.layers.enableSatellite).toBe(false);

    expect(config.app.public.enabled).toBe(false);
    expect(config.app.public.sessionId).toBe('');
    expect(config.app.public.layers).toHaveLength(1);
    expect(config.app.public.message).toBe('This Is Public');
  });

  test('should apply server key on config', () => {
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(`
      [app.layers]
      enableSatellite=false

      [app.public]
      layers=[
        { name="Layer A", url="https://web1.com/tile/{z}/{y}/{x}", attribution="Copyright 1" },
      ]
      message="This Is Public"
    `);

    const config = getConfig();

    expect(config.serverKey).toBe('server-key-456');
  });
});
