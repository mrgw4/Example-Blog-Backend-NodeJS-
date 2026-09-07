import { Router, Request, Response } from 'express';
import * as movieService from '../services/movieServices';
import mongoose from 'mongoose';

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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid movie id format' });
      return;
    }
    const movie = await movieService.getMovie(id);

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    return res.status(200).json(movie);
  } catch (error) {
    if (error instanceof Error && error.message.includes('connect')) {
      return res.status(503).json({ error: 'Database unavailable' });
    } if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Movie not found' });
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
    await movieService.createMovie(req.body);
    return res.status(201).json({ message: 'Movie created successfully' });
  } catch (error) {
    if (error instanceof Error) {
      // If it's a validation error (missing required fields)
      if (error.message.includes('Missing required fields')) {
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie id format' });
    }

    const movie = await movieService.deleteMovie(id);

    return res.status(200).json({ message: 'Movie deleted successfully', movie });
  } catch (error) {
    if (error instanceof Error && error.message.includes('connect')) {
      return res.status(503).json({ error: 'Database unavailable' });
    } else if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Movie not found' });
    } else {
      return res.status(500).json({ error: 'Failed to delete movie' });
    }
  }
});

/**
 * PUT /api/movies/:id
 * Updates a movie by ID.
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie id format' });
    }

    const allowedFields = [
      'awards',
      'cast',
      'countries',
      'directors',
      'fullplot',
      'genres',
      'imdb',
      'languages',
      'lastupdated',
      'metacritic',
      'num_mflix_comments',
      'plot',
      'poster',
      'rated',
      'released',
      'runtime',
      'title',
      'tomatoes',
      'type',
      'writers',
      'year',
    ];

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid fields provided for update',
      });
    }

    const movie = await movieService.updateMovie(id, updates);

    return res.status(200).json(movie);
  } catch (error) {
    if (error instanceof Error && error.message.includes('connect')) {
      return res.status(503).json({ error: 'Database unavailable' });
    } else if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Movie not found' });
    } else {
      return res.status(500).json({ error: 'Failed to update movie' });
    }
  }
});

export default router;
