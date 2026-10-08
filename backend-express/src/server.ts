import { app } from './app';
import { getEnvNumber } from './config/env';

const port = getEnvNumber('PORT', 8000);

app.listen(port, function onServerStarted() {
  console.log('Backend (Express) running on http://localhost:' + port);
});
