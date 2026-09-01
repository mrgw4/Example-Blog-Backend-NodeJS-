import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

const SOURCE_DB_NAME = 'sample_mflix';
const COLLECTIONS_TO_COPY = ['movies', 'comments', 'users'];

/**
 * Turns "/blog_test" into "blog_test"
 * and "blog_test" into "blog_test"
 */
/**
 * Normalises a database selection string by removing any leading slashes.
 *
 * @param dbSelection The raw database selection string from environment config.
 * @returns The normalized database name.
 */
export function normaliseDbName(dbSelection: string): string {
  return dbSelection.replace(/^\/+/, '').trim();
}

/**
 * Copies documents from a source database collection into a target database collection.
 *
 * @param sourceDb The source database instance.
 * @param targetDb The target database instance.
 * @param collectionName The collection name to copy.
 * @returns The number of documents copied.
 */
export async function copyCollection(
  sourceDb: mongoose.mongo.Db,
  targetDb: mongoose.mongo.Db,
  collectionName: string
): Promise<number> {
  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);

  const docs = await sourceCollection.find({}).toArray();

  await targetCollection.deleteMany({});

  if (docs.length > 0) {
    await targetCollection.insertMany(docs);
  }

  return docs.length;
}

/**
 * Resets the configured test database by copying documents from the source dataset.
 *
 * @returns An object mapping collection names to the number of documents copied.
 * @throws {Error} When configuration is invalid, connection is unavailable, or the source/target databases cannot be accessed.
 */
export async function resetTestDatabase(): Promise<Record<string, number>> {
  const dbSelection = process.env.DATABASE_SELECTION || '/blog_test';
  const targetDbName = normaliseDbName(dbSelection);

  if (!targetDbName) {
    throw new Error('DATABASE_SELECTION is missing or invalid');
  }

  // Safety guard: refuse to run unless the selected DB looks like a test DB
  if (!targetDbName.toLowerCase().includes('test')) {
    throw new Error(
      `Refusing to reset database "${targetDbName}" because it does not appear to be a test database`
    );
  }

  // We are already connected via mongoose.connect(...) in index.ts,
  // so reuse the existing mongoose connection and switch DBs from it.
  const baseConnection = mongoose.connection;

  if (!baseConnection.db) {
    throw new Error('MongoDB is not connected');
  }

  const sourceConn = baseConnection.useDb(SOURCE_DB_NAME, { useCache: true });
  const targetConn = baseConnection.useDb(targetDbName, { useCache: true });

  const sourceDb = sourceConn.db;
  const targetDb = targetConn.db;

  if (!sourceDb) {
    throw new Error(`Could not access source database "${SOURCE_DB_NAME}"`);
  }

  if (!targetDb) {
    throw new Error(`Could not access target database "${targetDbName}"`);
  }

  const results: Record<string, number> = {};

  for (const collectionName of COLLECTIONS_TO_COPY) {
    const copiedCount = await copyCollection(sourceDb, targetDb, collectionName);
    results[collectionName] = copiedCount;
  }

  return results;
}

/**
 * Express route handler for POST /reset.
 *
 * @param _req The incoming request object (unused).
 * @param res The Express response object.
 * @returns The response after attempting a database reset.
 */
export async function handleResetRouteInternal(
  _req: Request,
  res: Response,
  resetFn: () => Promise<Record<string, number>> = resetTestDatabase
): Promise<Response> {
  try {
    const copiedCollections = await resetFn();

    return res.status(200).json({
      message: 'Test database reset successfully',
      sourceDatabase: SOURCE_DB_NAME,
      targetDatabase: normaliseDbName(process.env.DATABASE_SELECTION || '/blog_test'),
      copiedCollections,
    });
  } catch (error) {
    console.error('Test database reset failed:', error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to reset test database' });
  }
}

export async function handleResetRoute(
  req: Request,
  res: Response
): Promise<Response> {
  return handleResetRouteInternal(req, res);
}

router.post('/reset', handleResetRoute);

export default router;