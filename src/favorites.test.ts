import { migrateFavorites, FavoritesData } from './favorites';

describe('migrateFavorites', () => {
  it('converts old string[] format to FavoritesData object', () => {
    const oldFormat = ['JetBrains Mono', 'Fira Code', 'Victor Mono'];

    const result = migrateFavorites(oldFormat);

    expect(result).toEqual({
      'JetBrains Mono': {},
      'Fira Code': {},
      'Victor Mono': {},
    });
  });

  it('preserves existing FavoritesData format unchanged', () => {
    const newFormat: FavoritesData = {
      'JetBrains Mono': {
        editor: { size: 14, weight: 'normal' },
      },
      'Fira Code': {
        terminal: { size: 12, weight: 'bold' },
      },
    };

    const result = migrateFavorites(newFormat);

    expect(result).toEqual(newFormat);
    // Should be the same reference since no migration needed
    expect(result).toBe(newFormat);
  });

  it('returns empty object for undefined input', () => {
    expect(migrateFavorites(undefined)).toEqual({});
  });

  it('handles empty array', () => {
    expect(migrateFavorites([])).toEqual({});
  });

  it('handles empty object', () => {
    const emptyObj: FavoritesData = {};
    expect(migrateFavorites(emptyObj)).toEqual({});
  });

  it('handles fonts with special characters in names', () => {
    const oldFormat = ['SF Pro', 'Source Code Pro', 'IBM Plex Mono'];

    const result = migrateFavorites(oldFormat);

    expect(Object.keys(result)).toHaveLength(3);
    expect(result['SF Pro']).toEqual({});
    expect(result['Source Code Pro']).toEqual({});
    expect(result['IBM Plex Mono']).toEqual({});
  });
});
