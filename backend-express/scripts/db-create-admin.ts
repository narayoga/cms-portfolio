/**
 * Create the first admin user in a (new) database.
 *
 *   npm run db:create-admin -- admin@example.com "a-strong-password" "Your Name"
 *
 * If the email already exists, its password and name are updated instead.
 */
import bcrypt from 'bcryptjs';
import { openScriptConnection, describeTargetDatabase } from './db-helpers';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  let name = process.argv[4];

  if (email === undefined || password === undefined) {
    console.log('Usage: npm run db:create-admin -- <email> <password> [name]');
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.log('The password must be at least 8 characters.');
    process.exitCode = 1;
    return;
  }

  if (name === undefined || name === '') {
    name = 'Admin';
  }

  console.log('Database: ' + describeTargetDatabase());
  const connection = await openScriptConnection();

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await connection.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = 'admin'`,
      [name, email, passwordHash]
    );

    console.log('Admin ready: ' + email);
  } finally {
    await connection.end();
  }
}

main().catch(function (error) {
  console.error('Failed:', error.message);
  process.exitCode = 1;
});
