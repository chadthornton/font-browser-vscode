import {
  extractFamilyName,
  convertFcWeightToCSS,
  looksMonospace,
  looksSerif,
} from './fonts';

describe('extractFamilyName', () => {
  it('returns simple font names unchanged', () => {
    expect(extractFamilyName('Inter')).toBe('Inter');
    expect(extractFamilyName('Roboto')).toBe('Roboto');
    expect(extractFamilyName('Arial')).toBe('Arial');
  });

  it('strips weight suffixes from font names', () => {
    expect(extractFamilyName('Source Code Pro Bold')).toBe('Source Code Pro');
    expect(extractFamilyName('Roboto Light')).toBe('Roboto');
    expect(extractFamilyName('Inter Medium')).toBe('Inter');
    expect(extractFamilyName('Fira Code SemiBold')).toBe('Fira Code');
    expect(extractFamilyName('JetBrains Mono ExtraBold')).toBe('JetBrains Mono');
  });

  it('strips style suffixes from font names', () => {
    expect(extractFamilyName('Fira Code Italic')).toBe('Fira Code');
    expect(extractFamilyName('Source Code Pro Oblique')).toBe('Source Code Pro');
  });

  it('strips combined weight and style suffixes', () => {
    expect(extractFamilyName('Fira Code Bold Italic')).toBe('Fira Code');
    expect(extractFamilyName('Source Code Pro Light Italic')).toBe('Source Code Pro');
    expect(extractFamilyName('JetBrains Mono SemiBold Italic')).toBe('JetBrains Mono');
  });

  it('handles hyphenated weight suffixes', () => {
    expect(extractFamilyName('Victor Mono-Bold')).toBe('Victor Mono');
    expect(extractFamilyName('Cascadia Code-Light')).toBe('Cascadia Code');
  });

  it('preserves font names that happen to contain weight words', () => {
    // "Regular" at the end should be stripped, but "Mono" should stay
    expect(extractFamilyName('JetBrains Mono Regular')).toBe('JetBrains Mono');
  });

  it('handles width variants', () => {
    expect(extractFamilyName('Roboto Condensed')).toBe('Roboto');
    expect(extractFamilyName('Inter Extended')).toBe('Inter');
  });

  it('returns original if stripping would result in empty string', () => {
    expect(extractFamilyName('Bold')).toBe('Bold');
    expect(extractFamilyName('Regular')).toBe('Regular');
  });
});

describe('convertFcWeightToCSS', () => {
  it('maps exact fontconfig weights to CSS values', () => {
    expect(convertFcWeightToCSS(0)).toEqual({
      value: '100',
      label: 'Thin',
      hasItalic: false,
    });
    expect(convertFcWeightToCSS(80)).toEqual({
      value: 'normal',
      label: 'Regular',
      hasItalic: false,
    });
    expect(convertFcWeightToCSS(200)).toEqual({
      value: 'bold',
      label: 'Bold',
      hasItalic: false,
    });
  });

  it('maps intermediate weights to closest CSS value', () => {
    // 60 is between Light (50) and Regular (80), closer to Light
    expect(convertFcWeightToCSS(60)).toEqual({
      value: '300',
      label: 'Light',
      hasItalic: false,
    });

    // 90 is between Regular (80) and Medium (100), equidistant - should match first found
    expect(convertFcWeightToCSS(90)).toEqual({
      value: 'normal',
      label: 'Regular',
      hasItalic: false,
    });

    // 190 is between SemiBold (180) and Bold (200), equidistant
    expect(convertFcWeightToCSS(190)).toEqual({
      value: '600',
      label: 'SemiBold',
      hasItalic: false,
    });
  });

  it('handles all standard fontconfig weight values', () => {
    const expectedMappings: Array<[number, string, string]> = [
      [0, '100', 'Thin'],
      [40, '200', 'ExtraLight'],
      [50, '300', 'Light'],
      [80, 'normal', 'Regular'],
      [100, '500', 'Medium'],
      [180, '600', 'SemiBold'],
      [200, 'bold', 'Bold'],
      [205, '800', 'ExtraBold'],
      [210, '900', 'Black'],
    ];

    for (const [fcWeight, cssValue, label] of expectedMappings) {
      const result = convertFcWeightToCSS(fcWeight);
      expect(result).not.toBeNull();
      expect(result!.value).toBe(cssValue);
      expect(result!.label).toBe(label);
    }
  });
});

describe('looksMonospace', () => {
  it('identifies fonts with mono-related keywords', () => {
    expect(looksMonospace('JetBrains Mono')).toBe(true);
    expect(looksMonospace('Fira Mono')).toBe(true);
    expect(looksMonospace('SF Mono')).toBe(true);
    expect(looksMonospace('Ubuntu Mono')).toBe(true);
    expect(looksMonospace('Roboto Mono')).toBe(true);
  });

  it('identifies fonts with code-related keywords', () => {
    expect(looksMonospace('Source Code Pro')).toBe(true);
    expect(looksMonospace('Fira Code')).toBe(true);
    expect(looksMonospace('Cascadia Code')).toBe(true);
  });

  it('identifies fonts with terminal/console keywords', () => {
    expect(looksMonospace('Consolas')).toBe(true);
    expect(looksMonospace('Terminal')).toBe(true);
  });

  it('identifies specific monospace fonts by name', () => {
    expect(looksMonospace('Menlo')).toBe(true);
    expect(looksMonospace('Monaco')).toBe(true);
    expect(looksMonospace('Hack')).toBe(true);
    expect(looksMonospace('Iosevka')).toBe(true);
    expect(looksMonospace('Inconsolata')).toBe(true);
  });

  it('returns false for non-monospace fonts', () => {
    expect(looksMonospace('Inter')).toBe(false);
    expect(looksMonospace('Roboto')).toBe(false);
    expect(looksMonospace('Arial')).toBe(false);
    expect(looksMonospace('Georgia')).toBe(false);
    expect(looksMonospace('Times New Roman')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(looksMonospace('JETBRAINS MONO')).toBe(true);
    expect(looksMonospace('fira code')).toBe(true);
    expect(looksMonospace('Menlo')).toBe(true);
  });
});

describe('looksSerif', () => {
  it('identifies fonts with serif keyword', () => {
    expect(looksSerif('Source Serif Pro')).toBe(true);
    expect(looksSerif('PT Serif')).toBe(true);
    expect(looksSerif('IBM Plex Serif')).toBe(true);
  });

  it('identifies classic serif fonts by name', () => {
    expect(looksSerif('Times New Roman')).toBe(true);
    expect(looksSerif('Georgia')).toBe(true);
    expect(looksSerif('Palatino')).toBe(true);
    expect(looksSerif('Garamond')).toBe(true);
    expect(looksSerif('Baskerville')).toBe(true);
    expect(looksSerif('Cambria')).toBe(true);
  });

  it('excludes sans-serif fonts even if they contain serif keywords', () => {
    expect(looksSerif('Source Sans Pro')).toBe(false);
    expect(looksSerif('Open Sans')).toBe(false);
    expect(looksSerif('Fira Sans')).toBe(false);
  });

  it('returns false for non-serif fonts', () => {
    expect(looksSerif('Inter')).toBe(false);
    expect(looksSerif('Roboto')).toBe(false);
    expect(looksSerif('Arial')).toBe(false);
    expect(looksSerif('JetBrains Mono')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(looksSerif('TIMES NEW ROMAN')).toBe(true);
    expect(looksSerif('georgia')).toBe(true);
  });
});
