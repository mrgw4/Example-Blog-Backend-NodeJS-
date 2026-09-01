import * as resetModule from '../testhelper/testResetHandler';
import mongoose from 'mongoose';
import { Request, Response } from 'express';

jest.mock('mongoose', () => ({
  connection: {
    db: {},
    useDb: jest.fn(),
  },
}));

describe('reset route handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_SELECTION = '/blog_test';
  });

  function createMockResponse() {
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    return res as Response;
  }

  it('returns 200 when reset route succeeds', async () => {
    const sourceCollection = {
      find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ a: 1 }]) }),
    };

    const targetCollection = {
      deleteMany: jest.fn().mockResolvedValue(undefined),
      insertMany: jest.fn().mockResolvedValue(undefined),
    };

    const useDbMock = mongoose.connection.useDb as jest.Mock;
    useDbMock
      .mockReturnValueOnce({ db: { collection: jest.fn().mockReturnValue(sourceCollection) } })
      .mockReturnValueOnce({ db: { collection: jest.fn().mockReturnValue(targetCollection) } });

    const res = createMockResponse();
    await resetModule.handleResetRoute({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test database reset successfully' })
    );
  });

  it('returns 400 when reset route throws a standard Error', async () => {
    const error = new Error('boom');
    const res = createMockResponse();

    await (resetModule as any).handleResetRouteInternal({} as Request, res, () => Promise.reject(error));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'boom' });
  });

  it('returns 500 when reset route throws a non-Error', async () => {
    const res = createMockResponse();

    await (resetModule as any).handleResetRouteInternal({} as Request, res, () => Promise.reject({ foo: 'bar' } as any));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to reset test database' });
  });
});
