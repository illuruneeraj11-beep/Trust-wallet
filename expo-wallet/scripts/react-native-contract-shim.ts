export const Platform = { OS: "web", select: <T>(values: { web?: T; default?: T }) => values.web ?? values.default };
export const AppState = { addEventListener: () => ({ remove: () => undefined }) };
