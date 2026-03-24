#!/usr/bin/env node

import { program } from 'commander';
import initCommand from './lib/commands/init.js';
import addCommand from './lib/commands/add.js';
import listCommand from './lib/commands/list.js';
import createCommand from './lib/commands/create.js';
import doctorCommand from './lib/commands/doctor.js';
import promptCommand from './lib/commands/prompt.js';

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
  .command('create [name]')
  .description('Scaffold a fresh MAD-compliant Android project')
  .action(createCommand);

program
  .command('add')
  .description('Add specific skills to your current project')
  .action(addCommand);

program
  .command('list')
  .description('List skills installed in the current project')
  .action(listCommand);

program
  .command('doctor')
  .description('Check architectural health of your project')
  .action(doctorCommand);

program
  .command('prompt')
  .description('Generate optimized system instructions for your AI Agent')
  .action(promptCommand);

program.parse();
