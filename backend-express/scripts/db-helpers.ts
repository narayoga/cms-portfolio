import mysql from 'mysql2/promise';
import { getEnv, getEnvNumber } from '../src/config/env';

/**
 * Open one database connection for the db:* scripts.
 * multipleStatements is turned on so a whole .sql file can run at once.
 * (The API itself never uses this: multiple statements are not safe for requests.)
 */
export async function openScriptConnection(): Promise<mysql.Connection> {
  return mysql.createConnection({
    host: getEnv('DB_HOST', 'localhost'),
    port: getEnvNumber('DB_PORT', 3306),
    database: getEnv('DB_NAME', 'portfolio_cms'),
    user: getEnv('DB_USER', 'root'),
    password: getEnv('DB_PASS', ''),
    charset: 'utf8mb4',
    multipleStatements: true,
    dateStrings: true,
  });
}

/**
 * Show which database a script is about to change, so you never run it
 * against the wrong one by accident.
 */
export function describeTargetDatabase(): string {
  return getEnv('DB_USER', 'root') + '@' + getEnv('DB_HOST', 'localhost') + '/' + getEnv('DB_NAME', 'portfolio_cms');
}
