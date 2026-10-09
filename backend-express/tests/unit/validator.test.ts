import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findMissingField, makeSlug, makeUniqueSlug, isValidEmail } from '../../src/lib/validator';
import { queryOne } from '../../src/lib/db';

// makeUniqueSlug asks the database whether a slug is taken.
// In a unit test we replace the database with a fake function.
vi.mock('../../src/lib/db', function () {
  return { queryOne: vi.fn() };
});

const fakeQueryOne = vi.mocked(queryOne);

describe('findMissingField', function () {
  it('returns the first missing or empty field', function () {
    expect(findMissingField({ name: 'A' }, ['name', 'email'])).toBe('email');
    expect(findMissingField({ name: '' }, ['name'])).toBe('name');
    expect(findMissingField({ name: null }, ['name'])).toBe('name');
  });

  it('returns null when every field is filled in', function () {
    expect(findMissingField({ name: 'A', email: 'a@b.c' }, ['name', 'email'])).toBe(null);
  });

  it('accepts 0 and false as filled in', function () {
    expect(findMissingField({ sort_order: 0, is_active: false }, ['sort_order', 'is_active'])).toBe(null);
  });
});

describe('makeSlug', function () {
  it('turns a title into a URL-friendly slug', function () {
    expect(makeSlug('Park Hyatt Jakarta!')).toBe('park-hyatt-jakarta');
    expect(makeSlug('  Door Closers & Hinges  ')).toBe('door-closers-hinges');
    expect(makeSlug('---Hello---')).toBe('hello');
  });

  it('returns an empty slug when there are no letters or numbers', function () {
    expect(makeSlug('!!!')).toBe('');
  });
});

describe('makeUniqueSlug', function () {
  beforeEach(function () {
    fakeQueryOne.mockReset();
  });

  it('keeps the slug when it is not used yet', async function () {
    fakeQueryOne.mockResolvedValueOnce(null);

    const slug = await makeUniqueSlug('projects', 'park-hyatt');

    expect(slug).toBe('park-hyatt');
  });

  it('adds -2, -3 ... until the slug is free', async function () {
    fakeQueryOne
      .mockResolvedValueOnce({ id: 1 }) // "park-hyatt" is taken
      .mockResolvedValueOnce({ id: 2 }) // "park-hyatt-2" is taken
      .mockResolvedValueOnce(null); // "park-hyatt-3" is free

    const slug = await makeUniqueSlug('projects', 'park-hyatt');

    expect(slug).toBe('park-hyatt-3');
    expect(fakeQueryOne).toHaveBeenCalledTimes(3);
  });

  it('uses "item" when the slug is empty', async function () {
    fakeQueryOne.mockResolvedValueOnce(null);

    const slug = await makeUniqueSlug('projects', '');

    expect(slug).toBe('item');
  });

  it('ignores the row itself when updating (excludeId)', async function () {
    fakeQueryOne.mockResolvedValueOnce(null);

    await makeUniqueSlug('projects', 'park-hyatt', { excludeId: 5 });

    const sql = fakeQueryOne.mock.calls[0][0];
    const params = fakeQueryOne.mock.calls[0][1];
    expect(sql).toContain('AND id <> ?');
    expect(params).toEqual(['park-hyatt', 5]);
  });

  it('only checks slugs inside the same parent (scopeColumn)', async function () {
    fakeQueryOne.mockResolvedValueOnce(null);

    await makeUniqueSlug('subcategories', 'hinges', { scopeColumn: 'category_id', scopeValue: 3 });

    const sql = fakeQueryOne.mock.calls[0][0];
    const params = fakeQueryOne.mock.calls[0][1];
    expect(sql).toContain('AND `category_id` = ?');
    expect(params).toEqual(['hinges', 3]);
  });
});

describe('isValidEmail', function () {
  it('accepts normal email addresses', function () {
    expect(isValidEmail('admin@example.com')).toBe(true);
    expect(isValidEmail('first.last@sub.example.co.id')).toBe(true);
  });

  it('rejects text that is not an email address', function () {
    expect(isValidEmail('admin@')).toBe(false);
    expect(isValidEmail('admin example.com')).toBe(false);
    expect(isValidEmail('admin@example')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
  });
});
