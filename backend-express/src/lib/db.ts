import mysql from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getEnv, getEnvNumber } from '../config/env';

// A value that can be passed into a "?" placeholder in a SQL query.
// A list (for example ["a", "b"]) is turned into  'a', 'b'  for use with IN (?)
export type SqlValue = string | number | boolean | null | Date | (string | number)[];

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

// The connection that withTransaction() gives you.
// Pass it to execute() / insert() to run that query inside the transaction.
export type Transaction = mysql.PoolConnection;

/**
 * Run an INSERT / UPDATE / DELETE, either on the pool (normal)
 * or on the connection of a transaction (when "transaction" is given).
 */
async function runWriteQuery(sql: string, params: SqlValue[], transaction: Transaction | null): Promise<ResultSetHeader> {
  if (transaction === null) {
    const [result] = await pool.query<ResultSetHeader>(sql, params);
    return result;
  }

  const [result] = await transaction.query<ResultSetHeader>(sql, params);
  return result;
}

/**
 * Run an UPDATE / DELETE and return how many rows were affected.
 * Inside withTransaction(), pass the transaction as the third argument.
 */
export async function execute(
  sql: string,
  params: SqlValue[] = [],
  transaction: Transaction | null = null
): Promise<number> {
  const result = await runWriteQuery(sql, params, transaction);
  return result.affectedRows;
}

/**
 * Run an INSERT and return the new row id.
 * Inside withTransaction(), pass the transaction as the third argument.
 */
export async function insert(
  sql: string,
  params: SqlValue[] = [],
  transaction: Transaction | null = null
): Promise<number> {
  const result = await runWriteQuery(sql, params, transaction);
  return result.insertId;
}

/**
 * Run several queries inside one transaction: either ALL changes are saved, or none.
 * If anything inside "work" throws an error, every change is rolled back.
 *
 * Usage:
 *   await withTransaction(async function (transaction) {
 *     await execute('DELETE FROM product_images WHERE product_id = ?', [productId], transaction);
 *     await insert('INSERT INTO product_images ...', [...], transaction);
 *   });
 */
export async function withTransaction<ResultType>(
  work: (transaction: Transaction) => Promise<ResultType>
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
