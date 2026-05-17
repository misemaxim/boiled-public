import fs from 'fs';
import { merge } from 'lodash';
import toml from 'toml';
import { AppConfig } from '../../types';
import { getServerKey } from './get-server-key';

interface Config {
  serverKey: string;
  superUser: string;
  app: AppConfig;
  server: {
    port: number
  }
}
const defaultConfig = (): Omit<Config, 'serverKey'> => ({
  superUser: '',
  app: {
    layers: {
      enableDefault: true,
      customLayers: [],
      enableSatellite: true
    },
    public: {
      enabled: false,
      sessionId: '',
      layers: [],
      message: '',
      metric: true
    }
  },
  server: {
    port: 9000
  }
});
export const getConfig = (): Config => {
  const config = {
    ...toml.parse(fs.readFileSync('config.toml', 'utf8'))
  } as Omit<Config, 'serverKey'>;

  return { ...merge({ ...defaultConfig() }, config), serverKey: getServerKey() };
};
