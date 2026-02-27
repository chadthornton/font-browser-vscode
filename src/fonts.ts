import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type FontCategory = 'monospace' | 'sans-serif' | 'serif';

export interface FontWeight {
  value: string;
  label: string;
  hasItalic: boolean;
}

export interface FontInfo {
  name: string;
  category: FontCategory;
  isInstalled: boolean;
  isVariable: boolean;
  hasLigatures: boolean;
  hasIcons: boolean;
  supportsLatin: boolean;
  weights: FontWeight[];
}

// Map fontconfig weight values to CSS weight values
const FC_TO_CSS_WEIGHT: Record<number, { value: string; label: string }> = {
  0: { value: '100', label: 'Thin' },
  40: { value: '200', label: 'ExtraLight' },
  50: { value: '300', label: 'Light' },
  80: { value: 'normal', label: 'Regular' },
  100: { value: '500', label: 'Medium' },
  180: { value: '600', label: 'SemiBold' },
  200: { value: 'bold', label: 'Bold' },
  205: { value: '800', label: 'ExtraBold' },
  210: { value: '900', label: 'Black' },
};

// Common weight/style suffixes to strip from font names
const WEIGHT_STYLE_SUFFIXES = [
  'Thin', 'Hairline', 'ExtraLight', 'Extra Light', 'UltraLight', 'Ultra Light',
  'Light', 'Regular', 'Normal', 'Book', 'Roman', 'Medium',
  'SemiBold', 'Semi Bold', 'Semibold', 'DemiBold', 'Demi Bold', 'Demibold',
  'Bold', 'ExtraBold', 'Extra Bold', 'UltraBold', 'Ultra Bold',
  'Black', 'Heavy', 'ExtraBlack', 'Extra Black', 'UltraBlack', 'Ultra Black',
  'Italic', 'Oblique', 'Slanted',
  'Condensed', 'Cond', 'Compressed', 'Narrow', 'Extended', 'Expanded', 'Wide',
  'Bold Italic', 'BoldItalic', 'Bold Oblique', 'BoldOblique',
  'Light Italic', 'LightItalic', 'Medium Italic', 'MediumItalic',
  'SemiBold Italic', 'SemiBoldItalic', 'ExtraBold Italic', 'ExtraBoldItalic',
  'Black Italic', 'BlackItalic', 'Thin Italic', 'ThinItalic',
];

// Curated font lists by category
const FONTS_BY_CATEGORY: Record<FontCategory, string[]> = {
  monospace: [
    'Victor Mono', 'JetBrains Mono', 'Fira Code', 'Monaspace Neon',
    'Monaspace Argon', 'Monaspace Xenon', 'Monaspace Radon', 'Monaspace Krypton',
    'SF Mono', 'Monaco', 'Menlo', 'Cascadia Code', 'Cascadia Mono',
    'Source Code Pro', 'IBM Plex Mono', 'Inconsolata', 'Hack', 'Consolas',
    'Ubuntu Mono', 'Roboto Mono', 'Anonymous Pro', 'Droid Sans Mono',
    'PT Mono', 'DejaVu Sans Mono', 'Courier New', 'Berkeley Mono',
    'Geist Mono', 'Input Mono', 'Iosevka', 'Fantasque Sans Mono',
    'Comic Mono', 'Operator Mono', 'Dank Mono', 'MonoLisa',
    'Recursive Mono', 'Space Mono',
  ],
  'sans-serif': [
    'SF Pro', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Helvetica',
    'Arial', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
    'Source Sans Pro', 'IBM Plex Sans', 'Nunito', 'Poppins', 'Raleway',
    'Ubuntu', 'Fira Sans', 'Work Sans', 'DM Sans', 'Geist',
  ],
  serif: [
    'New York', 'Georgia', 'Times New Roman', 'Palatino', 'Garamond',
    'Baskerville', 'Cambria', 'Constantia', 'Charter', 'Source Serif Pro',
    'IBM Plex Serif', 'Merriweather', 'Lora', 'Playfair Display',
    'Crimson Text', 'Libre Baskerville', 'PT Serif', 'American Typewriter', 'Courier',
  ],
};

// Fonts known to have programming ligatures (e.g., ->, =>, !=, ===)
// Includes base names - Nerd Font variants are matched via prefix
const LIGATURE_FONTS = new Set([
  'Fira Code',
  'JetBrains Mono',
  'Cascadia Code',
  'Victor Mono',
  'Monaspace Neon',
  'Monaspace Argon',
  'Monaspace Xenon',
  'Monaspace Radon',
  'Monaspace Krypton',
  'Iosevka',
  'Hasklig',
  'Monoid',
  'PragmataPro',
  'Dank Mono',
  'Operator Mono',
  'MonoLisa',
  'Recursive Mono',
  'Liga SFMono Nerd Font',
  'Lilex',
  'Maple Mono',
]);

// Language codes that use Latin script
const LATIN_LANG_CODES = new Set([
  'aa', 'af', 'ak', 'an', 'ast', 'ay', 'az', 'bem', 'ber', 'bg', 'bi', 'br',
  'bs', 'ca', 'ch', 'co', 'cs', 'cy', 'da', 'de', 'ee', 'en', 'eo', 'es',
  'et', 'eu', 'fi', 'fil', 'fj', 'fo', 'fr', 'fur', 'fy', 'ga', 'gd', 'gl',
  'gn', 'gv', 'ha', 'haw', 'ho', 'hr', 'ht', 'hu', 'ia', 'id', 'ie', 'ig',
  'ik', 'io', 'is', 'it', 'jv', 'kab', 'ki', 'kj', 'kl', 'kr', 'ku', 'kw',
  'la', 'lb', 'lg', 'li', 'ln', 'lt', 'lu', 'lv', 'mg', 'mh', 'mi', 'ms',
  'mt', 'na', 'nb', 'nd', 'nds', 'ng', 'nl', 'nn', 'no', 'nr', 'nso', 'nv',
  'ny', 'oc', 'om', 'os', 'pap', 'pl', 'pt', 'qu', 'rm', 'rn', 'ro', 'rw',
  'sc', 'se', 'sg', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st',
  'su', 'sv', 'sw', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tw', 'ty', 'uz',
  've', 'vi', 'vo', 'wa', 'wo', 'xh', 'yo', 'za', 'zu',
]);

interface FontStyleInfo {
  family: string;
  weight: number;
  hasItalic: boolean;
  isVariable: boolean;
  supportsLatin: boolean;
  isMonospace: boolean | null; // null = unknown (no spacing data from fontconfig)
  weightMin?: number;
  weightMax?: number;
}

async function getFontStylesFromSystem(): Promise<Map<string, FontStyleInfo[]>> {
  const fontStyles = new Map<string, FontStyleInfo[]>();

  if (process.platform === 'win32') {
    // Windows: Use PowerShell to get font families
    // Note: This doesn't provide weight/style metadata, so all fonts get default "Regular" weight
    try {
      const { stdout } = await execAsync(
        'powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; [System.Drawing.FontFamily]::Families | ForEach-Object { $_.Name }"',
        { maxBuffer: 10 * 1024 * 1024 }
      );

      for (const line of stdout.split('\n')) {
        const family = line.trim();
        if (!family) continue;

        // Add with default Regular weight (no metadata available on Windows)
        fontStyles.set(family, [{
          family,
          weight: 80, // Regular
          hasItalic: false,
          isVariable: false,
          supportsLatin: true, // No metadata on Windows, default to true
          isMonospace: null // No spacing metadata on Windows
        }]);
      }
    } catch {
      // PowerShell not available or failed
    }
  } else if (process.platform === 'darwin' || process.platform === 'linux') {
    try {
      // Use full path on macOS since VS Code may not have /opt/homebrew/bin in PATH
      const fcListCmd = process.platform === 'darwin'
        ? '/opt/homebrew/bin/fc-list : family style weight lang spacing 2>/dev/null || /usr/local/bin/fc-list : family style weight lang spacing 2>/dev/null || fc-list : family style weight lang spacing 2>/dev/null'
        : 'fc-list : family style weight lang spacing 2>/dev/null';
      const { stdout } = await execAsync(fcListCmd, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for systems with many fonts
      });

      for (const line of stdout.split('\n')) {
        if (!line.trim()) continue;

        // Parse: "Victor Mono:style=Bold Italic:weight=200"
        // Or variable: "Fira Code:weight=[50 200]"
        const familyMatch = line.match(/^([^:,]+)/);
        const weightRangeMatch = line.match(/weight=\[(\d+)\s+(\d+)\]/);
        const weightMatch = line.match(/weight=(\d+)(?!\s*\])/);
        const styleMatch = line.match(/style=([^:]+)/);
        const langMatch = line.match(/lang=([^:]+)/);
        const spacingMatch = line.match(/spacing=(\d+)/);

        if (familyMatch) {
          const family = familyMatch[1].trim();

          // Skip macOS system fonts (prefixed with dot)
          if (family.startsWith('.')) continue;
          const style = styleMatch ? styleMatch[1].toLowerCase() : '';
          const hasItalic = style.includes('italic') || style.includes('oblique');

          // fontconfig spacing: 100 = monospace, 90 = dual-width, null = unknown
          const isMonospace = spacingMatch
            ? (parseInt(spacingMatch[1], 10) >= 90)
            : null;

          // Check if font supports Latin script
          // lang= present means fontconfig has data; empty = no Latin coverage
          // lang= absent means fontconfig couldn't determine; assume Latin
          const langField = line.match(/:lang=([^:]*)/);
          let supportsLatin: boolean;
          if (langField) {
            const langStr = langField[1].trim();
            if (!langStr) {
              supportsLatin = false; // empty lang = no language coverage data = likely non-Latin symbol font
            } else {
              const langs = langStr.split('|').map(l => l.trim());
              supportsLatin = langs.some(l => LATIN_LANG_CODES.has(l));
            }
          } else {
            supportsLatin = true; // no lang field at all = assume Latin
          }

          if (!fontStyles.has(family)) {
            fontStyles.set(family, []);
          }

          const styles = fontStyles.get(family)!;

          if (weightRangeMatch) {
            // Variable font with weight range
            const weightMin = parseInt(weightRangeMatch[1], 10);
            const weightMax = parseInt(weightRangeMatch[2], 10);

            // Add entry marking this as variable
            const existing = styles.find(s => s.isVariable);
            if (!existing) {
              styles.push({
                family,
                weight: 80,
                hasItalic,
                isVariable: true,
                supportsLatin,
                isMonospace,
                weightMin,
                weightMax
              });
            } else {
              if (hasItalic) existing.hasItalic = true;
              if (supportsLatin) existing.supportsLatin = true;
              if (isMonospace !== null) existing.isMonospace = isMonospace;
            }
          } else {
            const weight = weightMatch ? parseInt(weightMatch[1], 10) : 80;

            // Check if we already have this weight
            const existing = styles.find(s => s.weight === weight && !s.isVariable);
            if (existing) {
              if (hasItalic) existing.hasItalic = true;
              if (supportsLatin) existing.supportsLatin = true;
              if (isMonospace !== null) existing.isMonospace = isMonospace;
            } else {
              styles.push({ family, weight, hasItalic, isVariable: false, supportsLatin, isMonospace });
            }
          }
        }
      }
    } catch {
      // fc-list not available
    }
  }

  return fontStyles;
}

export function extractFamilyName(fontName: string): string {
  let family = fontName.trim();
  const sortedSuffixes = [...WEIGHT_STYLE_SUFFIXES].sort((a, b) => b.length - a.length);

  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of sortedSuffixes) {
      const patterns = [
        new RegExp(`[\\s-]${suffix}$`, 'i'),
        new RegExp(`^${suffix}$`, 'i'),
      ];
      for (const pattern of patterns) {
        if (pattern.test(family)) {
          family = family.replace(pattern, '').trim();
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }

  family = family.replace(/[-\s]+$/, '').trim();
  return family || fontName;
}

export function convertFcWeightToCSS(fcWeight: number): FontWeight | null {
  // Find the closest matching weight
  const weights = Object.keys(FC_TO_CSS_WEIGHT).map(Number).sort((a, b) => a - b);

  let closest = weights[0];
  let minDiff = Math.abs(fcWeight - closest);

  for (const w of weights) {
    const diff = Math.abs(fcWeight - w);
    if (diff < minDiff) {
      minDiff = diff;
      closest = w;
    }
  }

  const mapping = FC_TO_CSS_WEIGHT[closest];
  if (mapping) {
    return { value: mapping.value, label: mapping.label, hasItalic: false };
  }
  return null;
}

export async function getSystemFonts(): Promise<FontInfo[]> {
  const fontStyles = await getFontStylesFromSystem();

  // Get all installed font families
  const installedFamilies = new Set<string>();
  for (const family of fontStyles.keys()) {
    const baseName = extractFamilyName(family);
    installedFamilies.add(baseName);
  }

  // Also check the raw family names
  const installedLower = new Set(
    Array.from(installedFamilies).map(f => f.toLowerCase())
  );

  const result: FontInfo[] = [];
  const addedFamilies = new Set<string>();

  // All standard CSS weights for variable fonts
  const ALL_WEIGHTS: FontWeight[] = [
    { value: '100', label: 'Thin', hasItalic: false },
    { value: '200', label: 'ExtraLight', hasItalic: false },
    { value: '300', label: 'Light', hasItalic: false },
    { value: 'normal', label: 'Regular', hasItalic: false },
    { value: '500', label: 'Medium', hasItalic: false },
    { value: '600', label: 'SemiBold', hasItalic: false },
    { value: 'bold', label: 'Bold', hasItalic: false },
    { value: '800', label: 'ExtraBold', hasItalic: false },
    { value: '900', label: 'Black', hasItalic: false },
  ];

  // Helper to check monospace status from fontconfig spacing data
  // Returns true/false if fontconfig has data, null if unknown
  const fontconfigIsMonospace = (fontName: string): boolean | null => {
    for (const [family, styles] of fontStyles.entries()) {
      const baseName = extractFamilyName(family);
      if (baseName.toLowerCase() === fontName.toLowerCase() ||
          family.toLowerCase() === fontName.toLowerCase()) {
        for (const s of styles) {
          if (s.isMonospace === true) return true;
          if (s.isMonospace === false) return false;
        }
      }
    }
    return null; // no data
  };

  // Helper to check if a font supports Latin script
  const fontSupportsLatin = (fontName: string): boolean => {
    for (const [family, styles] of fontStyles.entries()) {
      const baseName = extractFamilyName(family);
      if (baseName.toLowerCase() === fontName.toLowerCase() ||
          family.toLowerCase() === fontName.toLowerCase()) {
        if (styles.some(s => s.supportsLatin)) {
          return true;
        }
      }
    }
    return false;
  };

  // Helper to check if a font is variable
  const isFontVariable = (fontName: string): boolean => {
    for (const [family, styles] of fontStyles.entries()) {
      const baseName = extractFamilyName(family);
      if (baseName.toLowerCase() === fontName.toLowerCase() ||
          family.toLowerCase() === fontName.toLowerCase()) {
        if (styles.some(s => s.isVariable)) {
          return true;
        }
      }
    }
    return false;
  };

  // Helper to get weights for a font family
  const getWeightsForFont = (fontName: string): FontWeight[] => {
    const weights: FontWeight[] = [];
    const seenWeights = new Set<string>();
    let hasItalicVariant = false;

    // Look for exact match or variations
    for (const [family, styles] of fontStyles.entries()) {
      const baseName = extractFamilyName(family);
      if (baseName.toLowerCase() === fontName.toLowerCase() ||
          family.toLowerCase() === fontName.toLowerCase()) {

        // Check if this is a variable font
        const variableStyle = styles.find(s => s.isVariable);
        if (variableStyle) {
          // Variable font - return all standard weights
          hasItalicVariant = variableStyle.hasItalic;
          return ALL_WEIGHTS.map(w => ({
            ...w,
            hasItalic: hasItalicVariant
          }));
        }

        for (const style of styles) {
          const cssWeight = convertFcWeightToCSS(style.weight);
          if (cssWeight && !seenWeights.has(cssWeight.value)) {
            seenWeights.add(cssWeight.value);
            weights.push({
              value: cssWeight.value,
              label: cssWeight.label,
              hasItalic: style.hasItalic
            });
          }
          if (style.hasItalic) hasItalicVariant = true;
        }
      }
    }

    // Sort by weight value
    weights.sort((a, b) => {
      const aNum = a.value === 'normal' ? 400 : a.value === 'bold' ? 700 : parseInt(a.value, 10);
      const bNum = b.value === 'normal' ? 400 : b.value === 'bold' ? 700 : parseInt(b.value, 10);
      return aNum - bNum;
    });

    // If no weights found, return a default
    if (weights.length === 0) {
      weights.push({ value: 'normal', label: 'Regular', hasItalic: false });
    }

    return weights;
  };

  // Add installed fonts from curated lists (for proper categorization)
  for (const [category, fonts] of Object.entries(FONTS_BY_CATEGORY)) {
    for (const name of fonts) {
      const lowerName = name.toLowerCase();
      if (addedFamilies.has(lowerName)) continue;

      const isInstalled = installedLower.has(lowerName);
      if (!isInstalled) continue; // Only show installed fonts

      addedFamilies.add(lowerName);

      result.push({
        name,
        category: category as FontCategory,
        isInstalled: true,
        isVariable: isFontVariable(name),
        hasLigatures: hasLigatureSupport(name),
        hasIcons: hasIconSupport(name),
        supportsLatin: true, // Curated fonts are all Latin-script
        weights: getWeightsForFont(name),
      });
    }
  }

  // Add any installed fonts not in our curated list
  for (const family of installedFamilies) {
    // Skip macOS system fonts (prefixed with dot)
    if (family.startsWith('.')) continue;

    const lowerName = family.toLowerCase();
    if (addedFamilies.has(lowerName)) continue;

    let category: FontCategory = 'sans-serif';
    const fcMono = fontconfigIsMonospace(family);
    if (fcMono === true) {
      category = 'monospace';
    } else if (fcMono === null && looksMonospace(family)) {
      // No fontconfig data — fall back to keyword heuristics
      category = 'monospace';
    } else if (fcMono === false && looksSerif(family)) {
      category = 'serif';
    } else if (fcMono === null && looksSerif(family)) {
      category = 'serif';
    }

    addedFamilies.add(lowerName);
    result.push({
      name: family,
      category,
      isInstalled: true,
      isVariable: isFontVariable(family),
      hasLigatures: hasLigatureSupport(family),
      hasIcons: hasIconSupport(family),
      supportsLatin: fontSupportsLatin(family),
      weights: getWeightsForFont(family),
    });
  }

  return result;
}

function hasLigatureSupport(fontName: string): boolean {
  const lowerName = fontName.toLowerCase();
  // Check if font name starts with any known ligature font name
  for (const ligFont of LIGATURE_FONTS) {
    if (lowerName.startsWith(ligFont.toLowerCase())) {
      return true;
    }
  }
  return false;
}

function hasIconSupport(fontName: string): boolean {
  const lowerName = fontName.toLowerCase();
  // Nerd Fonts contain "nerd" in the name
  return lowerName.includes('nerd');
}

export function looksMonospace(fontName: string): boolean {
  const name = fontName.toLowerCase();

  // "Propo" suffix = Nerd Font proportional variant — NOT monospace
  if (name.includes('propo')) return false;

  const monoKeywords = [
    'mono', 'consol', 'courier', 'terminal', 'fixed',
    'typewriter', 'menlo', 'monaco', 'hack', 'iosevka', 'inconsolata',
  ];
  // "code" as a standalone word (not inside "unicode", etc.)
  const monoPatterns = [/\bcode\b/];
  return monoKeywords.some((keyword) => name.includes(keyword)) ||
    monoPatterns.some((pattern) => pattern.test(name));
}

export function looksSerif(fontName: string): boolean {
  const name = fontName.toLowerCase();
  const serifKeywords = [
    'serif', 'times', 'georgia', 'palatino', 'garamond', 'baskerville',
    'cambria', 'bodoni', 'didot', 'caslon', 'minion', 'sabon', 'charter',
    'bookman', 'century', 'clarendon', 'rockwell', 'typewriter',
  ];
  if (name.includes('sans')) return false;
  return serifKeywords.some((keyword) => name.includes(keyword));
}
