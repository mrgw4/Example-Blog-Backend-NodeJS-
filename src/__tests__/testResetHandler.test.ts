import mongoose from 'mongoose';
import { copyCollection, normaliseDbName, resetTestDatabase } from '../testhelper/testResetHandler';

jest.mock('mongoose', () => ({
  connection: {
    db: {},
    useDb: jest.fn(),
  },
}));

describe('testResetHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('normalises database names with leading slash', () => {
    expect(normaliseDbName('/blog_test')).toBe('blog_test');
  });

  it('normalises database names without leading slash', () => {
    expect(normaliseDbName('blog_test')).toBe('blog_test');
  });

  it('copies documents from source to target collection', async () => {
    const sourceCollection = { find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ a: 1 }]) }) };
    const targetCollection = { deleteMany: jest.fn().mockResolvedValue(undefined), insertMany: jest.fn().mockResolvedValue(undefined) };
    const sourceDb = { collection: jest.fn().mockReturnValue(sourceCollection) };
    const targetDb = { collection: jest.fn().mockReturnValue(targetCollection) };

    const result = await copyCollection(sourceDb as any, targetDb as any, 'movies');

    expect(sourceDb.collection).toHaveBeenCalledWith('movies');
    expect(targetDb.collection).toHaveBeenCalledWith('movies');
    expect(sourceCollection.find).toHaveBeenCalledWith({});
    expect(targetCollection.deleteMany).toHaveBeenCalledWith({});
    expect(targetCollection.insertMany).toHaveBeenCalledWith([{ a: 1 }]);
    expect(result).toBe(1);
  });

  it('does not insert when source collection is empty', async () => {
    const sourceCollection = { find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }) };
    const targetCollection = { deleteMany: jest.fn().mockResolvedValue(undefined), insertMany: jest.fn() };
    const sourceDb = { collection: jest.fn().mockReturnValue(sourceCollection) };
    const targetDb = { collection: jest.fn().mockReturnValue(targetCollection) };

    const result = await copyCollection(sourceDb as any, targetDb as any, 'comments');

    expect(targetCollection.deleteMany).toHaveBeenCalledWith({});
    expect(targetCollection.insertMany).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('throws when DATABASE_SELECTION is invalid', async () => {
    process.env.DATABASE_SELECTION = '/';
    await expect(resetTestDatabase()).rejects.toThrow('DATABASE_SELECTION is missing or invalid');
  });

  it('throws when target database is not a test DB', async () => {
    process.env.DATABASE_SELECTION = '/production';
    await expect(resetTestDatabase()).rejects.toThrow('Refusing to reset database "production" because it does not appear to be a test database');
  });

  it('throws when MongoDB is not connected', async () => {
    process.env.DATABASE_SELECTION = '/blog_test';
    (mongoose.connection as any).db = undefined;

    await expect(resetTestDatabase()).rejects.toThrow('MongoDB is not connected');
  });

  it('throws when the source database cannot be accessed', async () => {
    process.env.DATABASE_SELECTION = '/blog_test';
    (mongoose.connection as any).db = {};

    const useDbMock = mongoose.connection.useDb as jest.Mock;
    useDbMock.mockReturnValueOnce({ db: undefined }).mockReturnValueOnce({ db: {} });

    await expect(resetTestDatabase()).rejects.toThrow('Could not access source database "sample_mflix"');
  });

  it('throws when the target database cannot be accessed', async () => {
    process.env.DATABASE_SELECTION = '/blog_test';
    (mongoose.connection as any).db = {};

    const useDbMock = mongoose.connection.useDb as jest.Mock;
    useDbMock.mockReturnValueOnce({ db: {} }).mockReturnValueOnce({ db: undefined });

    await expect(resetTestDatabase()).rejects.toThrow('Could not access target database "blog_test"');
  });

  it('resets the test database successfully when source data exists', async () => {
    process.env.DATABASE_SELECTION = '/blog_test';

    const sourceCollection = {
      find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ a: 1 }]) }),
    };
    const targetCollection = {
      deleteMany: jest.fn().mockResolvedValue(undefined),
      insertMany: jest.fn().mockResolvedValue(undefined),
    };

    const sourceDb = { collection: jest.fn().mockReturnValue(sourceCollection) };
    const targetDb = { collection: jest.fn().mockReturnValue(targetCollection) };

    const useDbMock = mongoose.connection.useDb as jest.Mock;
    useDbMock.mockReturnValueOnce({ db: sourceDb }).mockReturnValueOnce({ db: targetDb });

    const result = await resetTestDatabase();

    expect(result).toEqual({ movies: 1, comments: 1, users: 1 });
    expect(targetCollection.deleteMany).toHaveBeenCalledTimes(3);
    expect(targetCollection.insertMany).toHaveBeenCalledTimes(3);
  });
});
