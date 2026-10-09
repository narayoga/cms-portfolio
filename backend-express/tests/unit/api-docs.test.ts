import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { router } from '../../src/routes';
import { loadApiDocs } from '../../src/lib/apiDocs';

/**
 * Keeps docs/openapi.yaml in sync with src/routes.ts.
 * When you add a route but forget to document it, this test fails.
 * (No database is needed: the routes are only listed, never called.)
 */

type RouteInfo = {
  method: string; // "get", "post", ...
  path: string; // OpenAPI style: /api/admin/projects/{id}
};

/**
 * List every route registered in src/routes.ts.
 * Express writes "/projects/:id", OpenAPI writes "/projects/{id}".
 */
function listRegisteredRoutes(): RouteInfo[] {
  const routes: RouteInfo[] = [];

  for (const layer of router.stack as any[]) {
    if (layer.route === undefined) {
      continue;
    }

    const openApiPath = String(layer.route.path).replace(/:([A-Za-z0-9_]+)/g, '{$1}');
    const methods = Object.keys(layer.route.methods);

    for (const method of methods) {
      routes.push({ method: method, path: openApiPath });
    }
  }

  return routes;
}

describe('API documentation (docs/openapi.yaml)', function () {
  const apiDocs = loadApiDocs();
  const registeredRoutes = listRegisteredRoutes();

  it('is an OpenAPI 3 document', function () {
    expect(String(apiDocs.openapi)).toMatch(/^3\./);
    expect(apiDocs.info.title).toBeTruthy();
  });

  it('documents every route in src/routes.ts', function () {
    const undocumentedRoutes: string[] = [];

    for (const route of registeredRoutes) {
      const pathDocs = apiDocs.paths[route.path];
      if (pathDocs === undefined || pathDocs[route.method] === undefined) {
        undocumentedRoutes.push(route.method.toUpperCase() + ' ' + route.path);
      }
    }

    expect(undocumentedRoutes).toEqual([]);
  });

  it('does not document routes that do not exist', function () {
    const unknownRoutes: string[] = [];
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];

    for (const documentedPath of Object.keys(apiDocs.paths)) {
      for (const method of Object.keys(apiDocs.paths[documentedPath])) {
        if (httpMethods.includes(method) === false) {
          continue;
        }

        const routeExists = registeredRoutes.some(function (route) {
          return route.path === documentedPath && route.method === method;
        });
        if (routeExists === false) {
          unknownRoutes.push(method.toUpperCase() + ' ' + documentedPath);
        }
      }
    }

    expect(unknownRoutes).toEqual([]);
  });

  it('marks every admin route as "needs a login token"', function () {
    const unprotectedAdminRoutes: string[] = [];

    for (const route of registeredRoutes) {
      if (route.path.startsWith('/api/admin/') === false) {
        continue;
      }

      const operation = apiDocs.paths[route.path]?.[route.method];
      const security = operation?.security ?? apiDocs.security;
      if (security === undefined || security.length === 0) {
        unprotectedAdminRoutes.push(route.method.toUpperCase() + ' ' + route.path);
      }
    }

    expect(unprotectedAdminRoutes).toEqual([]);
  });

  it('is shown as a Swagger UI page at /api/docs', async function () {
    const pageResponse = await request(app).get('/api/docs/');
    expect(pageResponse.status).toBe(200);
    expect(pageResponse.text).toContain('swagger-ui');

    const specResponse = await request(app).get('/api/docs/openapi.json');
    expect(specResponse.status).toBe(200);
    expect(specResponse.body.openapi).toBe(apiDocs.openapi);
  });
});
