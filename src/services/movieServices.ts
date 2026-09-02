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