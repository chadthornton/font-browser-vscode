# Font Browser

Browse and preview fonts for your VS Code editor and terminal from a convenient sidebar.

## Features

- **Live Preview** - See how fonts look before applying them
- **Editor & Terminal Tabs** - Configure fonts separately for code editing and terminal
- **Smart Filtering** - Filter by category (Monospace, Sans Serif, Serif) or features (Variable, Ligatures, Icons)
- **Favorites** - Star fonts you love for quick access
- **Font Metadata** - See badges for variable fonts (VF), ligature support (Lig), and Nerd Fonts (Nerd)
- **Weight Selection** - Choose from available font weights with italic indicators
- **Restore** - Quickly revert to your previous font settings

## Usage

1. Click the Font Browser icon in the Activity Bar (left sidebar)
2. Switch between **Editor** and **Terminal** tabs
3. Click any font to apply it instantly
4. Hover over fonts to preview before committing
5. Use the search box and filter toggles to find fonts
6. Star your favorites for quick access

## Platform Support

| Platform | Font Detection | Weight/Style Info |
|----------|---------------|-------------------|
| macOS    | Full          | Full              |
| Linux    | Full          | Full              |
| Windows  | Full          | Basic (Regular only) |

## Settings Modified

This extension modifies these VS Code settings:

- `editor.fontFamily` / `terminal.integrated.fontFamily`
- `editor.fontSize` / `terminal.integrated.fontSize`
- `editor.fontWeight` / `terminal.integrated.fontWeight`

## License

MIT
