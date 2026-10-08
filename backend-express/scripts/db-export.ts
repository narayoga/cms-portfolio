/**
 * Export all content (every row of every table) to one .sql file.
 *
 *   npm run db:export
 *
 * The file is saved in backend-express/backups/data-<time>.sql.
 * It only contains data (INSERT statements), not the table structure:
 * on a new database run "npm run db:migrate" first, then "npm run db:import -- <file>".
 *
 * Note: the file contains user password hashes. Keep it private.
 */
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { PROJECT_ROOT } from '../src/config/env';
import { openScriptConnection, describeTargetDatabase } from './db-helpers';

const BACKUPS_DIR = path.join(PROJECT_ROOT, 'backups');
const ROWS_PER_INSERT = 100;

async function main() {
  console.log('Database: ' + describeTargetDatabase());
  const connection = await openScriptConnection();

  try {
    const [tableRows] = await connection.query(
      "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
    );

    const lines: string[] = [];
    lines.push('-- Content export from ' + describeTargetDatabase() + ' on ' + new Date().toISOString());
    lines.push('-- Import into a database that already has the tables (npm run db:migrate).');
    lines.push('SET NAMES utf8mb4;');
    lines.push('SET FOREIGN_KEY_CHECKS = 0;');
    lines.push('');

    for (const tableRow of tableRows as any[]) {
      const tableName = tableRow.name;

      // schema_migrations belongs to the target database itself
      if (tableName === 'schema_migrations') {
        continue;
      }

      const [rows] = await connection.query('SELECT * FROM ??', [tableName]);
      const dataRows = rows as Record<string, any>[];

      lines.push('-- ' + tableName + ' (' + dataRows.length + ' rows)');
      lines.push(mysql.format('DELETE FROM ??;', [tableName]));

      // Write the rows in groups, so one INSERT never gets too big
      for (let start = 0; start < dataRows.length; start = start + ROWS_PER_INSERT) {
        const group = dataRows.slice(start, start + ROWS_PER_INSERT);
        const columnNames = Object.keys(group[0]);

        const valueLists = group.map(function (row) {
          const values = columnNames.map(function (columnName) {
            return row[columnName];
          });
          return mysql.format('(?)', [values]);
        });

        lines.push(mysql.format('INSERT INTO ?? (??) VALUES ', [tableName, columnNames]) + valueLists.join(',\n') + ';');
      }
      lines.push('');

      console.log('  ' + tableName + ': ' + dataRows.length + ' rows');
    }

    lines.push('SET FOREIGN_KEY_CHECKS = 1;');

    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const exportPath = path.join(BACKUPS_DIR, 'data-' + timestamp + '.sql');
    fs.writeFileSync(exportPath, lines.join('\n') + '\n');

    console.log('Saved: ' + exportPath);
  } finally {
    await connection.end();
  }
}

main().catch(function (error) {
  console.error('Export failed:', error.message);
  process.exitCode = 1;
});
