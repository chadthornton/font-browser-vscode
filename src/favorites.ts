// Favorites data structures and migration logic

export interface FavoriteSettings {
  size?: number;
  weight?: string;
  lineHeight?: number;
  letterSpacing?: number;
  boldWeight?: string; // Terminal only
}

export interface FavoritesData {
  [fontName: string]: {
    editor?: FavoriteSettings;
    terminal?: FavoriteSettings;
  };
}

/**
 * Migrates old favorites format (string[]) to new format (FavoritesData object).
 * Returns the data unchanged if already in the new format.
 */
export function migrateFavorites(stored: FavoritesData | string[] | undefined): FavoritesData {
  // Handle undefined/null
  if (!stored) {
    return {};
  }

  // Migration: convert old string[] format to new object format
  if (Array.isArray(stored)) {
    const migrated: FavoritesData = {};
    for (const fontName of stored) {
      migrated[fontName] = {};
    }
    return migrated;
  }

  // Already in new format
  return stored;
}
