import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { loadTestEnv, assertIsTestDatabase } from './test-env';
import { TEST_USERS } from './test-users';

/**
 * Runs ONCE before all integration tests:
 *   1. check that we are connected to a "_test" database
 *   2. delete every table
 *   3. create the tables again from migrations/000_baseline.sql (and later migrations)
 *   4. add one admin and one editor user
 */

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, '..', '..', 'migrations');

export default async function setupTestDatabase() {
  const testEnv = loadTestEnv();
  assertIsTestDatabase(testEnv.DB_NAME);

  const connection = await mysql.createConnection({
    host: testEnv.DB_HOST,
    port: Number(testEnv.DB_PORT || 3306),
    database: testEnv.DB_NAME,
    user: testEnv.DB_USER,
    password: testEnv.DB_PASS,
    charset: 'utf8mb4',
    multipleStatements: true,
  });

  try {
    await deleteAllTables(connection);
    await runAllMigrations(connection);
    await createTestUsers(connection);
  } finally {
    await connection.end();
  }
}

async function deleteAllTables(connection: mysql.Connection) {
  const [rows] = await connection.query('SHOW TABLES');

  const tableNames: string[] = [];
  for (const row of rows as Record<string, string>[]) {
    // Each row looks like { Tables_in_<database>: 'categories' }
    const tableName = Object.values(row)[0];
    tableNames.push(tableName);
  }

  if (tableNames.length === 0) {
    return;
  }

  let sql = 'SET FOREIGN_KEY_CHECKS = 0;';
  for (const tableName of tableNames) {
    sql = sql + ' DROP TABLE IF EXISTS `' + tableName + '`;';
  }
  sql = sql + ' SET FOREIGN_KEY_CHECKS = 1;';

  await connection.query(sql);
}

async function runAllMigrations(connection: mysql.Connection) {
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR).filter(function (fileName) {
    return fileName.endsWith('.sql');
  });
  migrationFiles.sort();

  for (const fileName of migrationFiles) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, fileName), 'utf8');
    await connection.query(sql);
  }
}

async function createTestUsers(connection: mysql.Connection) {
  const users = [TEST_USERS.admin, TEST_USERS.editor];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
      user.name,
      user.email,
      passwordHash,
      user.role,
    ]);
  }
}
