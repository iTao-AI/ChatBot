#!/usr/bin/env node
import { readFileSync } from 'fs';
import { spawn } from 'child_process';

// Parse .env file manually
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();
  // Remove surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  envVars[key] = value;
}

const child = spawn('npx', ['tsx', 'watch', 'src/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, ...envVars }
});

child.on('exit', (code) => process.exit(code ?? 0));
