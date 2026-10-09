import { describe, it, expect } from 'vitest';
import {
  getBody,
  hasValue,
  hasField,
  valueOrFallback,
  valueOrExisting,
  isEmptyValue,
  toInteger,
  toFlag,
  activeFlagForInsert,
  activeFlagForUpdate,
  splitImageList,
  toCleanText,
  todayAsText,
} from '../../src/lib/values';

describe('getBody', function () {
  it('returns the body when it is an object', function () {
    const fakeRequest: any = { body: { title: 'Hello' } };
    expect(getBody(fakeRequest)).toEqual({ title: 'Hello' });
  });

  it('returns an empty object for a missing body, text or a list', function () {
    expect(getBody({ body: undefined } as any)).toEqual({});
    expect(getBody({ body: null } as any)).toEqual({});
    expect(getBody({ body: 'text' } as any)).toEqual({});
    expect(getBody({ body: [1, 2, 3] } as any)).toEqual({});
  });
});

describe('hasValue and hasField', function () {
  const body = { title: 'Hello', category: null, count: 0 };

  it('hasValue is false for null and missing fields', function () {
    expect(hasValue(body, 'title')).toBe(true);
    expect(hasValue(body, 'count')).toBe(true);
    expect(hasValue(body, 'category')).toBe(false);
    expect(hasValue(body, 'missing')).toBe(false);
  });

  it('hasField is true for null fields, false for missing fields', function () {
    expect(hasField(body, 'category')).toBe(true);
    expect(hasField(body, 'missing')).toBe(false);
  });
});

describe('valueOrFallback and valueOrExisting', function () {
  it('valueOrFallback uses the fallback for null', function () {
    expect(valueOrFallback({ title: null }, 'title', 'old')).toBe('old');
    expect(valueOrFallback({ title: 'new' }, 'title', 'old')).toBe('new');
  });

  it('valueOrExisting lets the admin clear a field by sending null', function () {
    expect(valueOrExisting({ location: null }, 'location', 'Jakarta')).toBe(null);
    expect(valueOrExisting({}, 'location', 'Jakarta')).toBe('Jakarta');
  });
});

describe('isEmptyValue', function () {
  it('treats the same values as empty as PHP empty()', function () {
    const emptyValues = [undefined, null, false, 0, '', '0', []];
    for (const value of emptyValues) {
      expect(isEmptyValue(value)).toBe(true);
    }
  });

  it('treats other values as not empty', function () {
    const filledValues = ['a', 1, true, ' ', [0], {}];
    for (const value of filledValues) {
      expect(isEmptyValue(value)).toBe(false);
    }
  });
});

describe('toInteger', function () {
  it('converts values like PHP (int)', function () {
    expect(toInteger('12')).toBe(12);
    expect(toInteger(' 12 ')).toBe(12);
    expect(toInteger('12abc')).toBe(12);
    expect(toInteger('abc')).toBe(0);
    expect(toInteger(7.9)).toBe(7);
    expect(toInteger(true)).toBe(1);
    expect(toInteger(false)).toBe(0);
    expect(toInteger(null)).toBe(0);
    expect(toInteger(Infinity)).toBe(0);
  });
});

describe('active flags', function () {
  it('toFlag returns 1 or 0', function () {
    expect(toFlag(true)).toBe(1);
    expect(toFlag('1')).toBe(1);
    expect(toFlag('0')).toBe(0);
    expect(toFlag(false)).toBe(0);
  });

  it('a new row is active unless is_active is sent', function () {
    expect(activeFlagForInsert({})).toBe(1);
    expect(activeFlagForInsert({ is_active: 0 })).toBe(0);
  });

  it('an updated row keeps its value unless is_active is sent', function () {
    expect(activeFlagForUpdate({}, 0)).toBe(0);
    expect(activeFlagForUpdate({}, '1')).toBe(1);
    expect(activeFlagForUpdate({ is_active: true }, 0)).toBe(1);
  });
});

describe('splitImageList', function () {
  it('splits by new line and removes empty lines', function () {
    const text = '/uploads/a.jpg\n\n  /uploads/b.jpg  \n0\n';
    expect(splitImageList(text)).toEqual(['/uploads/a.jpg', '/uploads/b.jpg']);
  });

  it('returns an empty list for null', function () {
    expect(splitImageList(null)).toEqual([]);
  });
});

describe('toCleanText', function () {
  it('trims text and turns empty values into ""', function () {
    expect(toCleanText('  hello ')).toBe('hello');
    expect(toCleanText(null)).toBe('');
    expect(toCleanText(false)).toBe('');
    expect(toCleanText(true)).toBe('1');
    expect(toCleanText(42)).toBe('42');
  });
});

describe('todayAsText', function () {
  it('returns the date as YYYY-MM-DD', function () {
    expect(todayAsText()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
