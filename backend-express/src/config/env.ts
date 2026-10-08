import path from 'node:path';
import dotenv from 'dotenv';

// The backend-express folder (one folder above "src")
export const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..');

// The repository root, where the shared .env file with all secrets lives
export const REPOSITORY_ROOT = path.resolve(PROJECT_ROOT, '..');

// Load variables from the root .env into process.env
dotenv.config({ path: path.join(REPOSITORY_ROOT, '.env'), quiet: true });

/**
 * Read an environment variable.
 * If the variable is missing or empty, the default value is returned instead.
 */
export function getEnv(key: string, defaultValue: string): string {
  const value = process.env[key];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  return value;
}

/**
 * Read an environment variable as a number.
 */
export function getEnvNumber(key: string, defaultValue: number): number {
  const value = getEnv(key, String(defaultValue));
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return defaultValue;
  }

  return numberValue;
}

// Folder where uploaded files are stored (served at /uploads)
export const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
export const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
