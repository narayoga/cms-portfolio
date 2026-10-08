/**
 * Run a .sql file against the database in .env (for example a file made by db:export).
 *
 *   npm run db:import -- backups/data-2026-10-08T03-00-00.sql
 *
 * WARNING: an export file first DELETES all rows of each table, then inserts
 * the exported rows. Only import into the database you really want to replace.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT } from '../src/config/env';
import { openScriptConnection, describeTargetDatabase } from './db-helpers';

async function main() {
  const fileArgument = process.argv[2];

  if (fileArgument === undefined) {
    console.log('Usage: npm run db:import -- <file.sql>');
    process.exitCode = 1;
    return;
  }

  let filePath = fileArgument;
  if (path.isAbsolute(filePath) === false) {
    filePath = path.join(PROJECT_ROOT, fileArgument);
  }

  if (fs.existsSync(filePath) === false) {
    console.log('File not found: ' + filePath);
    process.exitCode = 1;
    return;
  }

  console.log('Database: ' + describeTargetDatabase());
  console.log('Importing: ' + filePath);

  const connection = await openScriptConnection();
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await connection.query(sql);
    console.log('Import done.');
  } finally {
    await connection.end();
  }
}

main().catch(function (error) {
  console.error('Import failed:', error.message);
  process.exitCode = 1;
});
