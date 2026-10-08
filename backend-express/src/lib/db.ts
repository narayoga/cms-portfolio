import mysql from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getEnv, getEnvNumber } from '../config/env';

// A value that can be passed into a "?" placeholder in a SQL query
export type SqlValue = string | number | boolean | null | Date;

// One connection pool shared by the whole app.
// The pool opens connections when needed and re-uses them between requests.
const pool = mysql.createPool({
  host: getEnv('DB_HOST', 'localhost'),
  port: getEnvNumber('DB_PORT', 3306),
  database: getEnv('DB_NAME', 'portfolio_cms'),
  user: getEnv('DB_USER', 'root'),
  password: getEnv('DB_PASS', ''),
  charset: 'utf8mb4',
  connectionLimit: 10,
  // Return DATE / DATETIME columns as plain strings ("2026-10-08"),
  // exactly like the PHP backend did, instead of JavaScript Date objects.
  dateStrings: true,
});

/**
 * Run a SELECT and return all rows.
 */
export async function queryAll<RowType = Record<string, any>>(
  sql: string,
  params: SqlValue[] = []
): Promise<RowType[]> {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return rows as RowType[];
}

/**
 * Run a SELECT and return the first row, or null when nothing was found.
 */
export async function queryOne<RowType = Record<string, any>>(
  sql: string,
  params: SqlValue[] = []
): Promise<RowType | null> {
  const rows = await queryAll<RowType>(sql, params);

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

/**
 * Run an UPDATE / DELETE and return how many rows were affected.
 */
export async function execute(sql: string, params: SqlValue[] = []): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(sql, params);
  return result.affectedRows;
}

/**
 * Run an INSERT and return the new row id.
 */
export async function insert(sql: string, params: SqlValue[] = []): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(sql, params);
  return result.insertId;
}

/**
 * Run several queries inside one transaction.
 * If anything inside "work" throws an error, every change is rolled back.
 */
export async function withTransaction<ResultType>(
  work: (connection: mysql.PoolConnection) => Promise<ResultType>
): Promise<ResultType> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close every connection (used by scripts so the process can exit).
 */
export async function closeDatabase(): Promise<void> {
  await pool.end();
}
