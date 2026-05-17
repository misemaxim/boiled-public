import { apiPluginCreate } from './api-plugin-create';
import { Request } from 'express';
import { serverStorage } from '../lib/server-storage';
import { PluginSchemaRaw, PluginTypes, API_ERRORS } from '../../types';
import { jestApiTest } from '../../../tests/jest-api-test';
import { validateOperation } from '../lib/validate-operation';

describe('apiPluginCreate', () => {
  let req: Request;

  beforeEach(() => {
    req = { body: {
      type: PluginTypes.Coordinates,
      name: 'Test Plugin',
      script: 'TEST-PLUGIN-SCRIPT'
    } as PluginSchemaRaw } as Request;
  });

  test('should put given plugin in the storage', async () => {
    const call = await jestApiTest(req, apiPluginCreate);
    const pluginId = call.response.data;

    const plugin = await serverStorage.plugin.get(pluginId);
    expect(plugin?.data).toEqual({
      type: PluginTypes.Coordinates,
      name: 'Test Plugin',
      script: 'TEST-PLUGIN-SCRIPT'
    });
    expect(call.response).toEqual({
      data: pluginId,
      completed: true,
      error: null
    });
  });

  test('should fail if operation is not validated', async () => {
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiPluginCreate);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.FORBIDDEN_OPERATION
    });
  });
});
