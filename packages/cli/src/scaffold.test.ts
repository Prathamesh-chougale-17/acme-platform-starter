import { describe, expect, it } from 'vitest';

import { FALLBACK_PACKAGE_NAME, toSlug } from './scaffold.js';

describe('toSlug', () => {
  it('lowercases uppercase input', () => {
    expect(toSlug('MyApp')).toBe('myapp');
  });

  it('replaces spaces with dashes', () => {
    expect(toSlug('my app')).toBe('my-app');
  });

  it('strips leading dashes', () => {
    expect(toSlug('-my-app')).toBe('my-app');
  });

  it('strips trailing dashes', () => {
    expect(toSlug('my-app-')).toBe('my-app');
  });

  it('collapses multiple consecutive dashes', () => {
    expect(toSlug('my--app')).toBe('my-app');
  });

  it('replaces special characters with dashes and collapses them', () => {
    expect(toSlug('my@app!')).toBe('my-app');
  });

  it('handles mixed case, spaces, and special chars together', () => {
    expect(toSlug('  My Awesome App!  ')).toBe('my-awesome-app');
  });

  it('returns the fallback for an empty string', () => {
    expect(toSlug('')).toBe(FALLBACK_PACKAGE_NAME);
  });

  it('returns the fallback for a whitespace-only string', () => {
    expect(toSlug('   ')).toBe(FALLBACK_PACKAGE_NAME);
  });

  it('returns the fallback for a string of only special chars', () => {
    expect(toSlug('!!!@@@')).toBe(FALLBACK_PACKAGE_NAME);
  });

  it('preserves existing valid slugs unchanged', () => {
    expect(toSlug('my-acme-app')).toBe('my-acme-app');
  });

  it('handles numbers in input', () => {
    expect(toSlug('app2024')).toBe('app2024');
  });
});
