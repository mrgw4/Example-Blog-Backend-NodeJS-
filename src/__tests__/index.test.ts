jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn(),
    connection: {
      ...actualMongoose.connection,
      db: {},
      useDb: jest.fn(),
    },
  };
});

import request from 'supertest';
import mongoose from 'mongoose';
import * as indexModule from '../index';

describe('index module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('exports the Express app', () => {
    expect(indexModule.app).toBeDefined();
    expect(typeof indexModule.app.use).toBe('function');
  });

  it('responds to health checks', async () => {
    const response = await request(indexModule.app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
  });

  it('errorHandler returns a standard 500 response', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
    const next = jest.fn();

    indexModule.errorHandler(new Error('boom'), {} as any, res, next as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    expect(next).not.toHaveBeenCalled();
  });

  it('connectDB calls mongoose.connect', async () => {
    const connectSpy = (mongoose.connect as jest.Mock).mockResolvedValue({} as any);

    await indexModule.connectDB();

    expect(connectSpy).toHaveBeenCalled();
  });

  it('connectDB throws when connection fails', async () => {
    const connectMock = (mongoose.connect as jest.Mock).mockRejectedValue(new Error('fail'));

    await expect(indexModule.connectDB()).rejects.toThrow('fail');
    expect(connectMock).toHaveBeenCalled();
  });

  it('startServer calls listen after connecting and executes callback', async () => {
    const connectMock = (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
    const listenSpy = jest.spyOn(indexModule.app, 'listen').mockImplementation((...args: any[]) => {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        callback();
      }
      return { close: jest.fn() } as any;
    });

    await indexModule.startServer();

    expect(connectMock).toHaveBeenCalled();
    expect(listenSpy).toHaveBeenCalled();
  });

  it('executeRunServerIfMain calls runServer when the module is main', () => {
    const runServerSpy = jest.spyOn(indexModule, 'runServerInternal').mockResolvedValue(undefined);

    indexModule.executeRunServerIfMain('test-file', 'test-file');

    expect(runServerSpy).toHaveBeenCalled();

    runServerSpy.mockRestore();
  });

  it('startServer catches errors when connectDB fails', async () => {
    const connectSpy = (mongoose.connect as jest.Mock).mockRejectedValue(new Error('boom'));
    const listenSpy = jest.spyOn(indexModule.app, 'listen');

    await expect(indexModule.startServer()).rejects.toThrow('boom');

    expect(connectSpy).toHaveBeenCalled();
    expect(listenSpy).not.toHaveBeenCalled();
  });

  it('runServer exits when startServer fails', async () => {
    const runServerSpy = jest.spyOn(indexModule, 'runServerInternal');
    const startServerSpy = jest.spyOn(indexModule, 'startServerInternal').mockRejectedValue(new Error('boom'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await indexModule.runServer();

    expect(startServerSpy).toHaveBeenCalled();
    expect(runServerSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    startServerSpy.mockRestore();
    runServerSpy.mockRestore();
  });
});
