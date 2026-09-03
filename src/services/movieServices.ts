import Movie from '../models/Movie';

/**
 * Retrieves all movies from the database.
 * @returns Promise resolving to the list of all movies.
 */
export async function getAllMovies() {
  return Movie.find().sort({ title: 1 });
}

/**
 * Retrieves paginated movies from the database with essential fields.
 * @param skip Number of documents to skip.
 * @param limit Number of documents to return.
 * @returns Promise resolving to the list of paginated movies.
 */
export async function getMoviesWithPagination(skip: number, limit: number) {
  return Movie.find()
    .select('title year type poster imdb.rating num_mflix_comments')
    .skip(skip)
    .limit(limit)
    .sort({ title: 1 });
}

/**
 * Retrieves the total count of movies in the database.
 * @returns Promise resolving to the total number of movies.
 */
export async function getTotalMovieCount() {
  return Movie.countDocuments();
}

/**
 * Retrieves a single movie by its ID.
 * @param id The movie's ID.
 * @returns Promise resolving to the movie document or null if not found.
 */
export async function getMovie(id: string) {
  return Movie.findById(id);
}

/**
 * Validates that all required fields are present in the movie data.
 * @param data The movie data to validate.
 * @returns An array of missing required fields, empty if all required fields are present.
 */
function validateRequiredFields(data: any): string[] {
  const missingFields: string[] = [];

  // Top-level required fields
  const topLevelRequired = [
    'title',
    'type',
    'year',
    'num_mflix_comments',
    'lastupdated',
  ];

  for (const field of topLevelRequired) {
    if (data[field] === undefined || data[field] === null) {
      missingFields.push(field);
    }
  }

  // Validate awards object
  if (!data.awards) {
    missingFields.push('awards');
  } else {
    if (!data.awards.nominations && data.awards.nominations !== 0) {
      missingFields.push('awards.nominations');
    }
    if (!data.awards.text) {
      missingFields.push('awards.text');
    }
    if (!data.awards.wins && data.awards.wins !== 0) {
      missingFields.push('awards.wins');
    }
  }

  // Validate imdb object
  if (!data.imdb) {
    missingFields.push('imdb');
  } else {
    if (!data.imdb.id && data.imdb.id !== 0) {
      missingFields.push('imdb.id');
    }
    if (data.imdb.rating === undefined || data.imdb.rating === null) {
      missingFields.push('imdb.rating');
    }
    if (data.imdb.votes === undefined || data.imdb.votes === null) {
      missingFields.push('imdb.votes');
    }
  }

  // Validate tomatoes object if present
  if (data.tomatoes) {
    if (!data.tomatoes.lastUpdated) {
      missingFields.push('tomatoes.lastUpdated');
    }
    if (!data.tomatoes.viewer) {
      missingFields.push('tomatoes.viewer');
    } else {
      if (!data.tomatoes.viewer.numReviews && data.tomatoes.viewer.numReviews !== 0) {
        missingFields.push('tomatoes.viewer.numReviews');
      }
      if (!data.tomatoes.viewer.rating && data.tomatoes.viewer.rating !== 0) {
        missingFields.push('tomatoes.viewer.rating');
      }
    }
    if (data.tomatoes.critic) {
      if (!data.tomatoes.critic.meter && data.tomatoes.critic.meter !== 0) {
        missingFields.push('tomatoes.critic.meter');
      }
      if (!data.tomatoes.critic.numReviews && data.tomatoes.critic.numReviews !== 0) {
        missingFields.push('tomatoes.critic.numReviews');
      }
      if (!data.tomatoes.critic.rating && data.tomatoes.critic.rating !== 0) {
        missingFields.push('tomatoes.critic.rating');
      }
    }
  }

  return missingFields;
}

/**
 * Creates a new movie after validating all required fields.
 * @param movieData The raw movie payload.
 * @returns Promise resolving to the created movie document.
 * @throws {Error} when required fields are missing or validation fails.
 */
export async function createMovie(movieData: any) {
  const missingFields = validateRequiredFields(movieData);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  return Movie.create(movieData);
}
/**
 * Deletes a movie by its ID.
 * @param id The movie's ID.
 * @returns Promise resolving to the deleted movie document or null if not found.
 */
export async function deleteMovie(id: string) {
  return Movie.findByIdAndDelete(id);
}