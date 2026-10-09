import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { PUBLIC_DIR } from '../../src/config/env';
import { loginAs, bearer } from './helpers';

describe('POST /api/admin/upload', function () {
  let editorToken = '';

  // Files created by these tests, removed again at the end
  const createdFiles: string[] = [];

  beforeAll(async function () {
    editorToken = await loginAs('editor');
  });

  afterAll(function () {
    for (const filePath of createdFiles) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  it('saves a document in the chosen folder and returns its public path', async function () {
    const response = await request(app)
      .post('/api/admin/upload?kind=file&folder=misc')
      .set('Authorization', bearer(editorToken))
      .attach('file', Buffer.from('hello from the tests'), 'Test Notes.txt');

    expect(response.status).toBe(200);

    const publicPath = response.body.data.path;
    expect(publicPath).toMatch(/^\/uploads\/misc\/test-notes-[0-9a-f]{6}\.txt$/);

    // The file really exists on disk
    const filePathOnDisk = path.join(PUBLIC_DIR, publicPath);
    createdFiles.push(filePathOnDisk);
    expect(fs.readFileSync(filePathOnDisk, 'utf8')).toBe('hello from the tests');

    // And it is served at that path
    const downloadResponse = await request(app).get(publicPath);
    expect(downloadResponse.status).toBe(200);
  });

  it('answers 401 without a token', async function () {
    const response = await request(app)
      .post('/api/admin/upload?folder=misc')
      .attach('file', Buffer.from('x'), 'a.txt');

    expect(response.status).toBe(401);
  });

  it('answers 422 for a folder that is not allowed', async function () {
    const response = await request(app)
      .post('/api/admin/upload?folder=../../secret')
      .set('Authorization', bearer(editorToken))
      .attach('file', Buffer.from('x'), 'a.txt');

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Invalid upload folder: ../../secret');
  });

  it('answers 415 for a file type that is not allowed', async function () {
    const response = await request(app)
      .post('/api/admin/upload?kind=image&folder=misc')
      .set('Authorization', bearer(editorToken))
      .attach('file', Buffer.from('x'), 'virus.exe');

    expect(response.status).toBe(415);
    expect(response.body.error).toBe('File type .exe not allowed');
  });

  it('answers 422 when no file is sent', async function () {
    const response = await request(app)
      .post('/api/admin/upload?folder=misc')
      .set('Authorization', bearer(editorToken))
      .field('something', 'else');

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('No file uploaded (file)');
  });
});
