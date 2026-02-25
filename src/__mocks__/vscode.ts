// Mock vscode module for unit testing
// Only includes the APIs used by FontBrowserViewProvider

export const Uri = {
  file: (path: string) => ({ fsPath: path, path }),
  joinPath: (base: { path: string }, ...pathSegments: string[]) => ({
    path: [base.path, ...pathSegments].join('/'),
  }),
};

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3,
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
    update: jest.fn(),
  })),
  onDidChangeConfiguration: jest.fn(),
};

// Mock ExtensionContext for testing favorites
export function createMockExtensionContext(initialState: Record<string, unknown> = {}) {
  const state = new Map(Object.entries(initialState));

  return {
    globalState: {
      get: jest.fn((key: string) => state.get(key)),
      update: jest.fn((key: string, value: unknown) => {
        state.set(key, value);
        return Promise.resolve();
      }),
      keys: jest.fn(() => Array.from(state.keys())),
    },
    subscriptions: [],
    extensionUri: Uri.file('/mock/extension'),
    extensionPath: '/mock/extension',
  };
}
