import { Router, Request, Response } from 'express';
import * as movieService from '../services/movieServices';

const router = Router();

/**
 * GET /api/movies?page=1&limit=20
 * Returns paginated movies from the database.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const [movies, total] = await Promise.all([
      movieService.getMoviesWithPagination(skip, limit),
      movieService.getTotalMovieCount()
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: movies,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('connect')) {
      return res.status(503).json({ error: 'Database unavailable' });
    } else {
      console.error('Error fetching movies:', error);
      return res.status(500).json({ error: 'Failed to fetch movies' });
    }
  }
});

/**
 * GET /api/movies/:id
 * Returns a single movie by ID.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const movie = await movieService.getMovie(id);

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    return res.status(200).json(movie);
  } catch (error) {
    if (error instanceof Error && error.message.includes('connect')) {
      return res.status(503).json({ error: 'Database unavailable' });
    } else {
      return res.status(500).json({ error: 'Failed to fetch movie' });
    }
  }
});

/**
 * POST /api/movies
 * Creates a new movie with validation for required fields.
 * Returns error message listing missing fields if validation fails.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const movie = await movieService.createMovie(req.body);
    return res.status(201).json(movie);
  } catch (error) {
    if (error instanceof Error) {
      // If it's a validation error (missing required fields)
      if (error.message.includes('Missing required fields')) {
        return res.status(400).json({ error: error.message });
      }
      // MongoDB validation errors
      if (error.message.includes('validation failed')) {
        return res.status(400).json({ error: error.message });
      }
      // Database connection errors
      if (error.message.includes('connect')) {
        return res.status(503).json({ error: 'Database unavailable' });
      }
    }
    return res.status(500).json({ error: 'Failed to create movie' });
  }
});

/**
 * DELETE /api/movies/:id
 * Deletes a movie by ID.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const movie = await movieService.deleteMovie(id);

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    return res.status(200).json({ message: 'Movie deleted successfully', movie });
  } catch (error) {
    if (error instanceof Error && error.message.includes('connect')) {
      return res.status(503).json({ error: 'Database unavailable' });
    } else {
      return res.status(500).json({ error: 'Failed to delete movie' });
    }
  }
});

export default router;
