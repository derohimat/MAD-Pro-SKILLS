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
  .action(initCommand);

program.parse();
