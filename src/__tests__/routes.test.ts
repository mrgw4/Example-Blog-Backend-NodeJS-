import request from 'supertest';
import express, { Express } from 'express';
import userRouter from '../routes/users';
import * as userServices from '../services/userServices';

jest.mock('../services/userServices');

const mockedServices = userServices as jest.Mocked<typeof userServices>;

const app: Express = express();
app.use(express.json());
app.use('/api/users', userRouter);

describe('users route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await request(app).post('/api/users').send({ email: 'test@example.com' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Name, email, and password are required' });
  });

  it('returns 200 and users on successful GET', async () => {
    mockedServices.getAllUsers.mockResolvedValue([{ id: '1', name: 'Jane Doe' }] as any);

    const response = await request(app).get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: '1', name: 'Jane Doe' }]);
  });

  it('returns 503 when getAllUsers throws a connect error', async () => {
    mockedServices.getAllUsers.mockRejectedValue(new Error('connect failed'));

    const response = await request(app).get('/api/users');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Database unavailable' });
  });

  it('returns 500 when getAllUsers fails unexpectedly', async () => {
    mockedServices.getAllUsers.mockRejectedValue(new Error('unexpected failure'));

    const response = await request(app).get('/api/users');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch users' });
  });

  it('returns 201 when createUser succeeds', async () => {
    mockedServices.createUser.mockResolvedValue({ id: '1', name: 'Jane Doe' } as any);

    const response = await request(app).post('/api/users').send({
      name: 'Jane Doe',
      email: 'test@example.com',
      password: 'password',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'User created successfully' });
  });

  it('returns 503 when the request body fails schema validation', async () => {
    const response = await request(app).post('/api/users').send({
      name: 'Jo',
      email: 'invalid-email',
      password: 'password',
    });

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('error');
  });

  it('returns 503 when createUser throws', async () => {
    mockedServices.createUser.mockRejectedValue(new Error('Email already in use'));

    const response = await request(app).post('/api/users').send({
      name: 'Jane Doe',
      email: 'test@example.com',
      password: 'password',
    });

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Email already in use' });
  });

  it('returns 500 when createUser throws a non-Error', async () => {
    mockedServices.createUser.mockRejectedValue({ foo: 'bar' });

    const response = await request(app).post('/api/users').send({
      name: 'Jane Doe',
      email: 'test@example.com',
      password: 'password',
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to create user' });
  });
});
