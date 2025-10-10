#!/usr/bin/env node

/**
 * LifeOS Cross-Platform Launcher
 * Works on macOS, Windows, and Linux
 *
 * Usage:
 *   node start.js
 *   OR double-click START_LIFEOS.command (macOS)
 *   OR double-click START_LIFEOS.bat (Windows)
 */

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

// Banner
console.log('\n');
log.title('╔════════════════════════════════════════╗');
log.title('║         LifeOS Launcher v1.0          ║');
log.title('║  Your Personal Life Operating System  ║');
log.title('╚════════════════════════════════════════╝');
console.log('\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  log.error(`Node.js ${nodeVersion} detected`);
  log.error('LifeOS requires Node.js 18 or higher');
  log.info('Download from: https://nodejs.org/');
  process.exit(1);
}

log.success(`Node.js ${nodeVersion} detected`);

// Check if npm is available
try {
  require.resolve('npm');
  log.success('npm is available');
} catch (err) {
  log.error('npm is not available');
  log.info('Please install npm (comes with Node.js)');
  process.exit(1);
}

console.log('');

// Check if node_modules exists
const nodeModulesPath = join(__dirname, 'node_modules');
const needsInstall = !existsSync(nodeModulesPath);

if (needsInstall) {
  log.warning('First time setup detected!');
  log.info('Installing dependencies... (this may take a minute)');
  console.log('');

  // Install dependencies
  const npmInstall = spawn('npm', ['install'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname,
  });

  npmInstall.on('close', (code) => {
    if (code === 0) {
      console.log('');
      log.success('Dependencies installed successfully!');
      console.log('');
      startServer();
    } else {
      console.log('');
      log.error('Failed to install dependencies');
      log.info('Try running: npm install');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  log.info('Starting LifeOS...');
  console.log('');
  log.success('Your browser will open automatically to:');
  console.log(`  ${colors.cyan}http://localhost:3000${colors.reset}`);
  console.log('');
  log.warning('Keep this window open while using LifeOS');
  log.warning('Press Ctrl+C to stop the server');
  console.log('');
  console.log('────────────────────────────────────────');
  console.log('');

  // Start the development server
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname,
  });

  devServer.on('close', (code) => {
    if (code !== 0) {
      console.log('');
      log.error('Server stopped with an error');
    }
    process.exit(code);
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n');
    log.info('Stopping LifeOS...');
    devServer.kill('SIGINT');
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  });
}
