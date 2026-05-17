import { apiPluginDefinitions } from './api-plugin-definitions';
import { Request } from 'express';
import { serverStorage } from '../lib/server-storage';
import { PluginTypes, API_ERRORS } from '../../types';
import { jestApiTest } from '../../../tests/jest-api-test';
import { validateOperation } from '../lib/validate-operation';

describe('apiPluginDefinitions', () => {
  let req: Request;

  beforeEach(async () => {
    req = { body: {} } as Request;
  });

  test('should return definitions for existing plugins', async () => {
    const [id1, id2] = await Promise.all([
      serverStorage.plugin.create({
        type: PluginTypes.Coordinates,
        name: 'Test Plugin 1',
        script: 'TEST-PLUGIN-SCRIPT-1'
      }),
      serverStorage.plugin.create({
        type: PluginTypes.Point,
        name: 'Test Plugin 2',
        script: 'TEST-PLUGIN-SCRIPT-2'
      })
    ]);

    const call = await jestApiTest(req, apiPluginDefinitions);

    expect(call.response).toEqual({
      data: [
        {
          _id: id1,
          timestamp: 1696896000000,
          data: {
            name: 'Test Plugin 1',
            type: 'coordinates',
            created: 1696896000000
          },
          _rev: '1696896000000'
        },
        {
          _id: id2,
          timestamp: 1696896000000,
          data: {
            name: 'Test Plugin 2',
            type: 'point',
            created: 1696896000000
          },
          _rev: '1696896000000'
        }
      ],
      completed: true,
      error: null
    });
  });

  test('should fail if operation is not validated', async () => {
    await serverStorage.plugin.create({
      type: PluginTypes.Coordinates,
      name: 'Test Plugin 1',
      script: 'TEST-PLUGIN-SCRIPT-1'
    });

    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiPluginDefinitions);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.FORBIDDEN_OPERATION
    });
  });
});