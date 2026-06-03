// ============================================================
// AUTH CONFIG
// ============================================================
// Set USE_MOCK_LOGIN = false untuk login via API Railway.
// Set USE_MOCK_LOGIN = true untuk bypass login (development).
// ============================================================

export const USE_MOCK_LOGIN = false;

// Fallback mock auth (digunakan jika USE_MOCK_LOGIN = true)
export const MOCK_AUTH = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMzZjYzU5Zi1mZGQzLTRhMzQtYjRlYS1jZjU5ZWIzMGExOGUiLCJlbWFpbCI6ImFkbWluQGlwbnUtbWFsYW5nLm9yZyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3OTI1NDgwOCwiZXhwIjoxNzc5MjU1NzA4fQ.VydCBJAvh1pVL4oWjpBzFQ05eder7KELoHPxP9s-3Zg',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMzZjYzU5Zi1mZGQzLTRhMzQtYjRlYS1jZjU5ZWIzMGExOGUiLCJlbWFpbCI6ImFkbWluQGlwbnUtbWFsYW5nLm9yZyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3OTI1NDgwOCwiZXhwIjoxNzc5ODU5NjA4fQ.oaHo0UWCmQpnc_LXiNXZj9vJBPaIFVAlVAAmxa5uZ7E',
  user: {
    id: 'b36cc59f-fdd3-4a34-b4ea-cf59eb30a18e',
    name: 'Admin Media',
    email: 'admin@ipnu-malang.org',
    role: 'ADMIN' as const,
  },
};
