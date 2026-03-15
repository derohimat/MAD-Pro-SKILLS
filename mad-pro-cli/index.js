#!/usr/bin/env node

import { program } from 'commander';
import initCommand from './lib/commands/init.js';

program
  .name('mad-pro')
  .description('MAD Pro CLI - Boost your project with AI Expert Skills')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize AI skills for your project')
  .option('--ai <name>', 'Specify the AI bridge to use (e.g., antigravity)')
  .option('--ide <type>', 'Specify the IDE (vscode, cursor, windsurf, android-studio, intellij, sublime, vim, neovim, zed, code-insiders)')
  .action(initCommand);

program.parse();
