import { createUser, getAllUsers, loginUser } from '../services/userServices';
import User from '../models/User';
import bcrypt from 'bcrypt';

jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
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
});
