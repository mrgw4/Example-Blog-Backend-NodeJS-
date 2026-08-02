import { createUser, getAllUsers, loginUser, createSession, verifySessionToken, deleteSessionToken } from '../services/userServices';
import User from '../models/User';
import Session from '../models/Session';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../models/Session', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockedUser = User as unknown as {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
};

const mockedSession = Session as unknown as {
  create: jest.Mock;
  findOne: jest.Mock;
  deleteOne: jest.Mock;
  findOneAndDelete: jest.Mock;
};

const mockedBcrypt = bcrypt as unknown as {
  hash: jest.Mock;
  compare: jest.Mock;
};

describe('userServices', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns users without password or email fields', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([{ _id: 'user-1', name: 'Jane Doe' }]),
    };

    mockedUser.find.mockReturnValue(query);

    const result = await getAllUsers();

    expect(mockedUser.find).toHaveBeenCalled();
    expect(query.select).toHaveBeenCalledWith('-password -email');
    expect(query.sort).toHaveBeenCalledWith({ name: -1 });
    expect(result).toEqual([{ _id: 'user-1', name: 'Jane Doe' }]);
  });

  it('throws when createUser is called with an existing email', async () => {
    mockedUser.findOne.mockResolvedValue({ email: 'test@example.com' });

    await expect(
      createUser({ name: 'Jane Doe', email: 'test@example.com', password: 'password' })
    ).rejects.toThrow('Email already in use');

    expect(mockedUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  it('hashes the password and creates a new user', async () => {
    mockedUser.findOne.mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue('hashed-password');
    mockedUser.create.mockResolvedValue({ id: '1', name: 'Jane Doe', email: 'test@example.com' });

    const result = await createUser({
      name: 'Jane Doe',
      email: 'test@example.com',
      password: 'password',
    });

    expect(mockedUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(mockedBcrypt.hash).toHaveBeenCalledWith('password', 12);
    expect(mockedUser.create).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'test@example.com',
      password: 'hashed-password',
    });
    expect(result).toEqual({ id: '1', name: 'Jane Doe', email: 'test@example.com' });
  });

  it('throws when loginUser cannot find a user', async () => {
    mockedUser.findOne.mockResolvedValue(null);

    await expect(loginUser('test@example.com', 'password')).rejects.toThrow('Invalid credentials');

    expect(mockedUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  it('throws when password comparison fails', async () => {
    mockedUser.findOne.mockResolvedValue({ password: 'hashed-password' });
    mockedBcrypt.compare.mockResolvedValue(false);

    await expect(loginUser('test@example.com', 'password')).rejects.toThrow('Invalid credentials');

    expect(mockedBcrypt.compare).toHaveBeenCalledWith('password', 'hashed-password');
  });

  it('returns a user when credentials are valid', async () => {
    const userRecord = { id: '1', email: 'test@example.com', password: 'hashed-password' };
    mockedUser.findOne.mockResolvedValue(userRecord);
    mockedBcrypt.compare.mockResolvedValue(true);

    const result = await loginUser('test@example.com', 'password');

    expect(result).toBe(userRecord);
    expect(mockedBcrypt.compare).toHaveBeenCalledWith('password', 'hashed-password');
  });

  it('creates a session for a valid user and token', async () => {
    mockedSession.create.mockResolvedValue({ user_id: 'user-1', jwt: 'token' });

    const result = await createSession('user-1', 'token');

    expect(mockedSession.create).toHaveBeenCalledWith({ user_id: 'user-1', jwt: 'token' });
    expect(result).toEqual({ user_id: 'user-1', jwt: 'token' });
  });

  it('verifies a session token successfully', async () => {
    const token = jwt.sign({ id: 'user-1', email: 'test@example.com' }, 'dev-secret', { expiresIn: '1h' });
    mockedSession.findOne.mockResolvedValue({
      createdAt: new Date(Date.now() - 1000),
      _id: 'session-1',
    });

    const result = await verifySessionToken(token);

    expect(result.userId).toBe('user-1');
    expect(result.email).toBe('test@example.com');
  });

  it('deletes an expired session token and throws', async () => {
    const token = jwt.sign({ id: 'user-1' }, 'dev-secret', { expiresIn: '1h' });
    mockedSession.findOne.mockResolvedValue({
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      _id: 'session-1',
    });
    mockedSession.deleteOne.mockResolvedValue({});

    await expect(verifySessionToken(token)).rejects.toThrow('Token expired');
    expect(mockedSession.deleteOne).toHaveBeenCalledWith({ _id: 'session-1' });
  });

  it('throws when no session exists for the token', async () => {
    mockedSession.findOne.mockResolvedValue(null);

    await expect(verifySessionToken('missing-token')).rejects.toThrow('Invalid token');
  });

  it('deletes a session token when the decoded payload has no id', async () => {
    const token = jwt.sign({ email: 'test@example.com' }, 'dev-secret', { expiresIn: '1h' });
    mockedSession.findOne.mockResolvedValue({
      createdAt: new Date(),
      _id: 'session-1',
    });
    mockedSession.deleteOne.mockResolvedValue({});

    await expect(verifySessionToken(token)).rejects.toThrow('Invalid token');
    expect(mockedSession.deleteOne).toHaveBeenCalledWith({ _id: 'session-1' });
  });

  it('deletes an invalid session token and throws', async () => {
    const token = 'invalid-token';
    mockedSession.findOne.mockResolvedValue({
      createdAt: new Date(),
      _id: 'session-1',
    });
    mockedSession.deleteOne.mockResolvedValue({});

    await expect(verifySessionToken(token)).rejects.toThrow('jwt malformed');
    expect(mockedSession.deleteOne).not.toHaveBeenCalled();
  });

  it('deletes a session token on logout', async () => {
    mockedSession.findOneAndDelete.mockResolvedValue({ jwt: 'token' });

    const result = await deleteSessionToken('token');

    expect(mockedSession.findOneAndDelete).toHaveBeenCalledWith({ jwt: 'token' });
    expect(result).toEqual({ jwt: 'token' });
  });
});
