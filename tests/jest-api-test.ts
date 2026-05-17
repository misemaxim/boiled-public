import { Request, Response } from 'express';
import { jestMockCall } from './jest-mock-call';

export const jestApiTest = async (
  req: Request,
  callback: (req: Request, res: Response) => Promise<void> | void
) => {
  const res = {
    status: jest.fn(() => res) as Response['status'],
    json: jest.fn(() => res) as Response['json'],
    cookie: jest.fn(() => res) as Response['cookie'],
    setHeader: jest.fn(() => res) as Response['setHeader'],
    end: jest.fn(() => res) as Response['end'],
    clearCookie: jest.fn() as Response['clearCookie']
  } as Response;

  await callback(req, res);

  return {
    response: jestMockCall(res.json)[0] && jestMockCall(res.json)[0][0],
    mocks: res
  };
};
