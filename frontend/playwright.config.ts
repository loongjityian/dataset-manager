import { defineConfig, devices } from '@playwright/test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Own ports and a throwaway database, so E2E runs never touch dev servers or real data.
const API_PORT = 8765
const WEB_PORT = 5175
const databasePath = join(tmpdir(), `dataset-manager-e2e-${Date.now()}.db`)

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      name: 'api',
      command: `uv run uvicorn app.main:app --port ${API_PORT}`,
      cwd: '../backend',
      env: { DATABASE_PATH: databasePath },
      url: `http://127.0.0.1:${API_PORT}/health`,
      reuseExistingServer: false,
    },
    {
      name: 'web',
      command: `pnpm exec vite --port ${WEB_PORT} --strictPort`,
      env: { API_PROXY_TARGET: `http://127.0.0.1:${API_PORT}` },
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
    },
  ],
})
