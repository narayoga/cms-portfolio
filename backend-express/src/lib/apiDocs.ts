import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { PROJECT_ROOT } from '../config/env';

// The API documentation (OpenAPI 3). Edit this file when you add or change a route.
export const API_DOCS_FILE = path.join(PROJECT_ROOT, 'docs', 'openapi.yaml');

/**
 * Read docs/openapi.yaml and return it as an object.
 */
export function loadApiDocs(): Record<string, any> {
  const fileContent = fs.readFileSync(API_DOCS_FILE, 'utf8');
  return YAML.parse(fileContent);
}
