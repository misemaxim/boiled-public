import { Application, Request, Response, static as expressStatic } from 'express';
import { jestMockCall } from '../../../tests/jest-mock-call';
import { serverDocs } from './serve-docs';
import { validateOperation } from './validate-operation';

jest.mock('express', () => ({
  static: jest.fn(() => 'expressStatic_return')
}));

describe('serverDocs', () => {
  let app: Application;

  beforeEach(() => {
    app = {
      use: jest.fn() as Application['use']
    } as Application;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should have precheck to serve docs only to logged in user', async () => {
    const req = {} as Request;
    const res = {
      redirect: jest.fn() as Response['redirect']
    } as Response;
    const next = jest.fn();

    serverDocs(app);

    const call = jestMockCall(app.use)[0];
    expect(call[0]).toBe('/docs');

    const callback = call[1];

    await callback(req, res, next);
    expect(next).toBeCalledTimes(1);
    expect(res.redirect).toBeCalledTimes(0);

    (validateOperation as jest.Mock).mockResolvedValueOnce(null);
    await callback(req, res, next);
    expect(next).toBeCalledTimes(1);
    expect(res.redirect).toBeCalledTimes(1);
  });

  test('should serve docs folder', async () => {
    serverDocs(app);

    const call = jestMockCall(app.use)[1];
    expect(call[0]).toBe('/docs');
    expect(call[1]).toBe('expressStatic_return');

    expect(expressStatic).toBeCalledTimes(1);
    expect(expressStatic).toHaveBeenCalledWith('docs');
  });
});
