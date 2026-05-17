import { jestApiTest } from '../../../tests/jest-api-test';
import { apiGetIcons } from './api-get-icons';
import { Request } from 'express';
import { jestMockCall } from '../../../tests/jest-mock-call';

describe('apiGetIcons', () => {
  test('should return requested icon as svg', async () => {
    const call = await jestApiTest({
      query: {
        icon: 'home',
        color: '#1234FF'
      } as Request['query']
    } as Request, apiGetIcons);

    expect(call.mocks.status).toBeCalledTimes(1);
    expect(call.mocks.status).toHaveBeenCalledWith(200);

    expect(call.mocks.setHeader).toBeCalledTimes(1);
    expect(call.mocks.setHeader).toHaveBeenCalledWith('content-type', 'image/svg+xml');

    expect(call.mocks.end).toBeCalledTimes(1);
    expect(jestMockCall(call.mocks.end)[0][0])
      .toContain('<svg color="#1234FF" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-home');
  });

  test('should return 404 if icon is not found', async () => {
    const call = await jestApiTest({
      query: {
        icon: 'randomizer',
        color: '#1234FF'
      } as Request['query']
    } as Request, apiGetIcons);

    expect(call.mocks.status).toBeCalledTimes(1);
    expect(call.mocks.status).toHaveBeenCalledWith(404);
  });
});
