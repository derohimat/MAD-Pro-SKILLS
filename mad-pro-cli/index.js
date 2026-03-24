#!/usr/bin/env node

import { program } from 'commander';
import initCommand from './lib/commands/init.js';
import addCommand from './lib/commands/add.js';
import listCommand from './lib/commands/list.js';

program
  .name('mad-pro')
  .description('MAD Pro CLI - Boost your project with AI Expert Skills')
  .version('1.2.0');

program
  .command('init')
  .description('Initialize AI skills for your project (Interactive Wizard)')
  .option('--ide <type>', 'Specify the IDE (vscode, cursor, windsurf, android-studio, intellij, sublime, vim, neovim, zed, code-insiders)')
  .action(initCommand);

program
  .command('add')
  .description('Add specific skills to your current project')
  .action(addCommand);

program
  .command('list')
  .description('List skills installed in the current project')
  .action(listCommand);

program.parse();
