import { API_ERRORS } from '../../types';
import { Request, Response } from 'express';
import { respond } from './respond';
import { logger } from './logger';

jest.mock('./logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

describe('respond', () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    req = {} as Request;
    res = {
      status: jest.fn(() => res) as Response['status'],
      json: jest.fn(() => res) as Response['json']
    } as Response;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should respond with completed response if no errors', () => {
    const data = { responded: 'data' };
    respond(req, res, data);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toBeCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      data,
      error: null,
      completed: true
    });
  });

  test('should respond with uncompleted response if expected error occurs', () => {
    const data = { responded: 'data' };
    respond(req, res, data, new Error(API_ERRORS.USER_EXISTS));

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toBeCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      data,
      error: API_ERRORS.USER_EXISTS,
      completed: false
    });
  });

  test('should respond with uncompleted response if unexpected error occurs', () => {
    const data = { responded: 'data' };
    respond(req, res, data, new Error());

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toBeCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      data,
      error: 'UNEXPECTED',
      completed: false
    });
  });

  test('should log error when responded with an error', () => {
    const data = { responded: 'data' };
    respond(req, res, data, new Error(API_ERRORS.USER_EXISTS));

    expect(logger.error).toBeCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('Error: ' + API_ERRORS.USER_EXISTS);
  });
});
