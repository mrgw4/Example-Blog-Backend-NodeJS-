import request from 'supertest';
import express, { Express } from 'express';
import movieRouter from '../routes/movies';
import * as movieServices from '../services/movieServices';
import mongoose from 'mongoose';

jest.mock('../services/movieServices');

const mockedServices = movieServices as jest.Mocked<typeof movieServices>;

const app: Express = express();
app.use(express.json());
app.use('/api/movies', movieRouter);

const movieTestData = { _id: 1, plot: 'plot', genres: ['Drama'], runtime: 1, rated: 'PASSED', cast: ['Joe Blogs'], title: 'movie', fullplot: 'fullplot', countries: ['USA'], released: '2020-01-01', directors: ['director'], writers: ['writer'], awards: { wins: 1, nominations: 0, text: '1 win.' }, lastupdated: '2020-01-01', year: 2020, imdb: { rating: 8.5, votes: 1, id: 1 }, type: 'movie', tomatoes: { viewer: { rating: 5, numReviews: 1, meter: 90 }, dvd: '2020-01-01', lastUpdated: '2020-01-01' }, num_mflix_comments: 0 }

describe('movies route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and movies on successful GET', async () => {

    mockedServices.getMoviesWithPagination.mockResolvedValue([movieTestData] as any);
    mockedServices.getTotalMovieCount.mockResolvedValue(5);

    const response = await request(app).get('/api/movies?page=1&limit=10');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ "data": [movieTestData], "pagination": { "page": 1, "limit": 10, "total": 5, "pages": 1, "hasNextPage": false, "hasPrevPage": false } });
  });

  it('returns 503 when getMoviesWithPagination throws a connect error', async () => {
    mockedServices.getMoviesWithPagination.mockRejectedValue(new Error('connect failed'));

    const response = await request(app).get('/api/movies');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Database unavailable' });
  });

  it('returns 500 when getMoviesWithPagination fails unexpectedly', async () => {
    mockedServices.getMoviesWithPagination.mockRejectedValue(new Error('unexpected failure'));
    jest.spyOn(console, 'error').mockImplementation(() => { });

    const response = await request(app).get('/api/movies');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch movies' });
  });


  it('returns 200 and the requested movie when it exists', async () => {
    mockedServices.getMovie.mockResolvedValue(movieTestData as any);

    const response = await request(app).get('/api/movies/507f1f77bcf86cd799439011').set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(movieTestData);
  });

  it('returns 404 when the requested movie does not exist', async () => {
    mockedServices.getMovie.mockResolvedValue(null);

    const response = await request(app).get('/api/movies/507f1f77bcf86cd799439011');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Movie not found' });
  });

  it('returns 400 when id is in an invalid format', async () => {
    mockedServices.getMovie.mockResolvedValue(null);

    const response = await request(app).get('/api/movies/123');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid movie id format' });
  });

  it('returns 503 when getMovie throws a connect error', async () => {
    mockedServices.getMovie.mockRejectedValue(new Error('connect failed'));

    const response = await request(app).get('/api/movies/507f1f77bcf86cd799439011');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Database unavailable' });
  });

  it('returns 404 when getMovie throws a not-found error', async () => {
    mockedServices.getMovie.mockRejectedValue(new Error('not found'));

    const response = await request(app).get('/api/movies/507f1f77bcf86cd799439011');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Movie not found' });
  });

  it('returns 500 when getMovie throws an unexpected error', async () => {
    mockedServices.getMovie.mockRejectedValue(new Error('unexpected failure'));

    const response = await request(app).get('/api/movies/507f1f77bcf86cd799439011');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch movie' });
  });

  it('returns 400 when GET /:id has invalid ObjectId format', async () => {
    const response = await request(app).get('/api/movies/123');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid movie id format' });
  });

  // POST /api/movies tests (create movie)
  it('returns 201 when createMovie succeeds', async () => {
    mockedServices.createMovie.mockResolvedValue({} as any);

    const response = await request(app).post('/api/movies').send(movieTestData);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Movie created successfully' });
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await request(app).post('/api/movies').send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Missing required fields',
      fields: ['title', "type", "year", "num_mflix_comments", "lastupdated", "awards", "imdb",],
    });
  });

  it('returns 400 when fields are invalid', async () => {
    const modifiedTestData = { ...movieTestData, title: 123 };
    const response = await request(app).post('/api/movies').send(modifiedTestData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid movie data',
      fields: ["title"],
    });
  });

  it('returns 400 with invalid Mongoose fields', async () => {
    const validationError = new mongoose.Error.ValidationError();

    validationError.addError(
      'title',
      new mongoose.Error.ValidatorError({
        path: 'title',
        message: 'Please provide a title',
      })
    );

    mockedServices.createMovie.mockRejectedValue(validationError);

    const response = await request(app)
      .post('/api/movies')
      .send(movieTestData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid movie data',
      fields: ['title'],
    });
  });

  it('returns 503 when createMovie throws a connect error', async () => {
    mockedServices.createMovie.mockRejectedValue(new Error('connect failed'));

    const response = await request(app).post('/api/movies').send(movieTestData);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Database unavailable' });
  });

  it('returns 500 when createMovie throws an unexpected Error', async () => {
    mockedServices.createMovie.mockRejectedValue(new Error('Unknown'));

    const response = await request(app).post('/api/movies').send(movieTestData);


    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to create movie' });
  });

  it('returns 500 when createMovie throws a non-Error', async () => {
    mockedServices.createMovie.mockRejectedValue({ foo: 'bar' });

    const response = await request(app).post('/api/movies').send(movieTestData);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to create movie' });
  });



  // PUT /api/movies/:id tests
  it('returns 200 when updateMovie succeeds', async () => {
    mockedServices.updateMovie.mockResolvedValue(movieTestData as any);

    const response = await request(app)
      .put('/api/movies/507f1f77bcf86cd799439011')
      .send({ title: 'Updated Title' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(movieTestData);
  });

  it('returns 400 when update has no fields to update', async () => {
    const response = await request(app)
      .put('/api/movies/507f1f77bcf86cd799439011')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('No valid fields provided for update');
  });

  it('returns 400 when update has invalid ID format', async () => {
    const response = await request(app)
      .put('/api/movies/invalid-id')
      .set('Authorization', 'Bearer valid-token')
      .send({ title: 'Updated Title' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid movie id format' });
  });

  it('returns 404 when updating a movie that does not exist', async () => {
    mockedServices.updateMovie.mockRejectedValue(new Error('movie not found'));

    const response = await request(app)
      .put('/api/movies/507f1f77bcf86cd799439011')
      .set('Authorization', 'Bearer valid-token')
      .send({ title: 'Updated Title' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Movie not found' });
  });

  it('returns 503 when updateMovie throws a connect error', async () => {
    mockedServices.updateMovie.mockRejectedValue(new Error('connect failed'));

    const response = await request(app)
      .put('/api/movies/507f1f77bcf86cd799439011')
      .set('Authorization', 'Bearer valid-token')
      .send({ title: 'Updated Title' });

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Database unavailable' });
  });

  it('returns 500 when updateMovie throws an unexpected error', async () => {
    mockedServices.updateMovie.mockRejectedValue(new Error('unexpected failure'));

    const response = await request(app)
      .put('/api/movies/507f1f77bcf86cd799439011')
      .set('Authorization', 'Bearer valid-token')
      .send({ title: 'Updated Title' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to update movie' });
  });

  it('returns 400 when PUT has invalid ObjectId like 123', async () => {
    const response = await request(app)
      .put('/api/movies/123')
      .set('Authorization', 'Bearer valid-token')
      .send({ title: 'Updated Title' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid movie id format' });
  });


  // DELETE /api/movies/:id tests
  it('returns 200 when deleteMovie succeeds', async () => {
    mockedServices.deleteMovie.mockResolvedValue({ _id: 'movie-1', name: 'Jane Doe' } as any);

    const response = await request(app)
      .delete('/api/movies/507f1f77bcf86cd799439011')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Movie deleted successfully');
  });

  it('returns 400 when delete has invalid ID format', async () => {
    const response = await request(app)
      .delete('/api/movies/invalid-id')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid movie id format' });
  });

  it('returns 503 when deleteMovie throws a connect error', async () => {
    mockedServices.deleteMovie.mockRejectedValue(new Error('connect failed'));

    const response = await request(app)
      .delete('/api/movies/507f1f77bcf86cd799439011')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Database unavailable' });
  });

  it('returns 500 when deleteMovie throws an unexpected error', async () => {
    mockedServices.deleteMovie.mockRejectedValue(new Error('unexpected failure'));

    const response = await request(app)
      .delete('/api/movies/507f1f77bcf86cd799439011')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to delete movie' });
  });

  it('returns 400 when delete has invalid ObjectId like 123', async () => {
    const response = await request(app)
      .delete('/api/movies/123')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid movie id format' });
  });

  it('returns 404 when deleting a movie that does not exist', async () => {
    mockedServices.deleteMovie.mockRejectedValue(new Error('movie not found'));

    const response = await request(app)
      .delete('/api/movies/507f1f77bcf86cd799439011')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Movie not found' });
  });
});
