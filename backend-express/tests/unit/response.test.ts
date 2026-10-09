import { describe, it, expect } from 'vitest';
import { sendOk, sendError } from '../../src/lib/response';

function makeFakeResponse() {
  const fakeResponse: any = {
    statusCode: 0,
    body: null,
    status: function (code: number) {
      fakeResponse.statusCode = code;
      return fakeResponse;
    },
    json: function (data: unknown) {
      fakeResponse.body = data;
      return fakeResponse;
    },
  };
  return fakeResponse;
}

describe('sendOk', function () {
  it('sends { ok: true, data } with status 200', function () {
    const response = makeFakeResponse();
    sendOk(response, { id: 5 });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true, data: { id: 5 } });
  });

  it('sends data: null when there is no data', function () {
    const response = makeFakeResponse();
    sendOk(response);

    expect(response.body).toEqual({ ok: true, data: null });
  });
});

describe('sendError', function () {
  it('sends { ok: false, error } with the given status', function () {
    const response = makeFakeResponse();
    sendError(response, 'Not found', 404);

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ ok: false, error: 'Not found' });
  });

  it('uses status 400 by default and adds extra fields', function () {
    const response = makeFakeResponse();
    sendError(response, 'Bad input', undefined, { field: 'email' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ ok: false, error: 'Bad input', field: 'email' });
  });
});
