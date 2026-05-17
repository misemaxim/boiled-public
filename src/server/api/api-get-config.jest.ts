import { apiGetConfig } from './api-get-config';
import { Request } from 'express';
import { jestApiTest } from '../../../tests/jest-api-test';
import system from '../../../package.json';
import { validateOperation } from '../lib/validate-operation';
import { getConfig } from '../lib/get-config';

describe('apiGetConfig', () => {
  let req: Request;

  beforeEach(() => {
    req = {} as Request;
  });

  test('should return app config given logged user', async () => {
    const call = await jestApiTest(req, apiGetConfig);

    expect(call.response).toEqual({
      data: {
        layers: {
          enableDefault: true,
          customLayers: [],
          enableSatellite: true
        },
        public: {
          enabled: false,
          sessionId: 'public-session',
          layers: [{ name: 'Layer A', url: 'https://web1.com/tile/{z}/{y}/{x}', attribution: 'Copyright 1' }],
          message: 'Disclaimer'
        },
        version: system.version,
        name: system.name,
        license: system.license
      },
      completed: true,
      error: null
    });
  });

  test('should return app config given no logged user and public session is enabled', async () => {
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiGetConfig);

    expect(call.response).toEqual({
      data: {
        layers: {
          enableDefault: false,
          customLayers: [{ name: 'Layer A', url: 'https://web1.com/tile/{z}/{y}/{x}', attribution: 'Copyright 1' }],
          enableSatellite: false
        },
        public: {
          enabled: true,
          sessionId: 'public-session',
          layers: [{ name: 'Layer A', url: 'https://web1.com/tile/{z}/{y}/{x}', attribution: 'Copyright 1' }],
          message: 'Disclaimer'
        },
        version: system.version,
        name: system.name,
        license: system.license
      },
      completed: true,
      error: null
    });
  });

  test('should return app config given no logged user and no public session enabled', async () => {
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);
    (getConfig as jest.Mock).mockReturnValueOnce({
      serverKey: 'server-key-----1234566789',
      superUser: 'user-123',
      app: {
        layers: {
          enableDefault: true,
          customLayers: [],
          enableSatellite: true
        },
        public: {
          enabled: false,
          sessionId: 'public-session',
          layers: [{ name: 'Layer A', url: 'https://web1.com/tile/{z}/{y}/{x}', attribution: 'Copyright 1' }],
          message: 'Disclaimer'
        }
      }
    });

    const call = await jestApiTest(req, apiGetConfig);

    expect(call.response).toEqual({
      data: {
        layers: {
          enableDefault: false,
          customLayers: [],
          enableSatellite: false
        },
        public: {
          enabled: false,
          sessionId: '',
          layers: [],
          message: ''
        },
        version: system.version,
        name: system.name,
        license: system.license
      },
      completed: true,
      error: null
    });
  });
});
