import { app } from './app';
import { getEnvNumber } from './config/env';
import { assertJwtSecretIsSafe } from './lib/auth';

// Refuse to start without a safe JWT_SECRET: with a missing or public secret,
// anyone could create a valid admin login token.
try {
  assertJwtSecretIsSafe();
} catch (error: any) {
  console.error('Cannot start the server: ' + error.message);
  process.exit(1);
}

const port = getEnvNumber('PORT', 8000);

app.listen(port, function onServerStarted() {
  console.log('Backend (Express) running on http://localhost:' + port);
});
