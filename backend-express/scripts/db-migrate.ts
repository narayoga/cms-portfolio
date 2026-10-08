/**
 * Run every .sql file in backend-express/migrations that has not run yet.
 *
 *   npm run db:migrate
 *
 * Files run in name order (000_baseline.sql, 001_..., 002_...).
 * Each file that ran is saved in the "schema_migrations" table,
 * so running this command again only runs the new files.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT } from '../src/config/env';
import { openScriptConnection, describeTargetDatabase } from './db-helpers';

const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'migrations');

async function main() {
  console.log('Database: ' + describeTargetDatabase());
  const connection = await openScriptConnection();

  try {
    await connection.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         file_name VARCHAR(255) NOT NULL PRIMARY KEY,
         ran_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    // Which files already ran?
    const [rows] = await connection.query('SELECT file_name FROM schema_migrations');
    const alreadyRan = new Set<string>();
    for (const row of rows as any[]) {
      alreadyRan.add(row.file_name);
    }

    const allFiles = fs.readdirSync(MIGRATIONS_DIR).filter(function (fileName) {
      return fileName.endsWith('.sql');
    });
    allFiles.sort();

    let ranCount = 0;
    for (const fileName of allFiles) {
      if (alreadyRan.has(fileName)) {
        console.log('  skip  ' + fileName + ' (already ran)');
        continue;
      }

      console.log('  run   ' + fileName);
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, fileName), 'utf8');
      await connection.query(sql);
      await connection.query('INSERT INTO schema_migrations (file_name) VALUES (?)', [fileName]);
      ranCount = ranCount + 1;
    }

    console.log('Done. ' + ranCount + ' migration(s) ran.');
  } finally {
    await connection.end();
  }
}

main().catch(function (error) {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
