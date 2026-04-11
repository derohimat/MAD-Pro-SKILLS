import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { program } from 'commander';
import { loadConfig, updateConfig } from '../utils/config.js';
import { runArchitectureCheck } from './doctor/architecture-checker.js';
import { runSecurityScan } from './doctor/security-scanner.js';
import { runDiffReview } from './doctor/diff-reviewer.js';

export default async function doctorCommand(cmdObj) {
  // Setup flags natively (if called directly or parsed from args)
  // In a robust setup this would be registered in index.js for the commander instance,
  // but we can check raw arguments here if not passed.
  const isSecurity = cmdObj?.security || process.argv.includes('--security') || process.argv.includes('-s');
  const isFix = cmdObj?.fix || process.argv.includes('--fix');
  const reviewBranch = cmdObj?.review || getArgValue('--review');
  const outputFile = cmdObj?.output || getArgValue('--output');

  console.log(chalk.bold.magenta('\n🩺 MAD Pro Doctor - Project Audit'));

  const rootDir = process.cwd();
  let config = loadConfig(rootDir) || {};

  // Interactive Architecture Template Selection on first run
  if (!config.architecture) {
    console.log(chalk.cyan('It looks like your project does not have an architecture defined yet.'));
    const archRes = await inquirer.prompt([{
      type: 'list',
      name: 'architecture',
      message: 'Select your project architecture (for accurate anti-pattern scanning):',
      choices: [
        { name: 'MVVM (ViewModel + StateFlow/LiveData)', value: 'mvvm' },
        { name: 'MVI (Intent → State → Effect)', value: 'mvi' },
        { name: 'Clean + MVI (Use Case + MVI in ViewModel)', value: 'clean+mvi' },
        { name: 'MVP (Presenter + View interface)', value: 'mvp' },
        { name: 'VIPER (View, Interactor, Presenter, Entity, Router)', value: 'viper' },
        { name: 'Custom (Skip strict architecture checks)', value: 'custom' }
      ]
    }]);

    const diRes = await inquirer.prompt([{
      type: 'list',
      name: 'di',
      message: 'Select your Dependency Injection framework:',
      choices: [
        { name: 'Hilt', value: 'hilt' },
        { name: 'Koin', value: 'koin' },
        { name: 'None/Manual', value: 'none' }
      ]
    }]);

    config = updateConfig({ architecture: archRes.architecture, di: diRes.di }, rootDir);
    console.log(chalk.green(`\n✓ Configured for ${archRes.architecture.toUpperCase()} + ${diRes.di}. (Saved in .mad-pro.json)\n`));
  }

  console.log(chalk.gray(`Running checks for Architecture: [${config.architecture.toUpperCase()}] and DI: [${config.di}]...\n`));

  let issues = [];
  let fileCount = 0;

  if (reviewBranch) {
    console.log(chalk.cyan(`🔍 Diff Code Review against branch: ${reviewBranch}`));
    try {
      const reviewResult = await runDiffReview(rootDir, reviewBranch, config, isSecurity);
      issues = reviewResult.issues;
      fileCount = reviewResult.files;
      console.log(chalk.gray(`Scanned ${fileCount} changed files.\n`));
    } catch (e) {
      console.error(chalk.red(e.message));
      return;
    }
  } else {
    issues = await runArchitectureCheck(rootDir, config);
    if (isSecurity) {
      console.log(chalk.cyan(`🔒 Running Security & Memory Leak Scanners...`));
      const secIssues = await runSecurityScan(rootDir);
      issues = [...issues, ...secIssues];
    }
  }

  // Formatting and outputting issues
  if (issues.length === 0) {
    console.log(chalk.bold.green('\n🎉 Your project looks 100% MAD-compliant!'));
  } else {
    let criticals = 0;
    let warnings = 0;

    issues.forEach(issue => {
      const prefix = issue.severity === 'critical' ? chalk.red('❌ [CRITICAL]') : chalk.yellow('⚠️  [WARNING]');
      if (issue.severity === 'critical') criticals++; else warnings++;
      
      console.log(`${prefix} ${issue.title}`);
      console.log(chalk.gray(`   📍 File: ${issue.file}:${issue.line}`));
      if (issue.message) console.log(chalk.white(`   ℹ️  ${issue.message}`));
      if (issue.refactor) {
         console.log(chalk.cyan(`   💡 Refactor:`));
         const refactorLines = issue.refactor.split('\\n');
         refactorLines.forEach(l => console.log(chalk.cyan(`      ${l}`)));
      }
      console.log('');
    });

    console.log(chalk.bold('——————————————————————'));
    console.log(`${chalk.red(`❌ ${criticals} Critical`)} | ${chalk.yellow(`⚠️ ${warnings} Warning`)}`);
    console.log(chalk.bold.yellow(`\n⚠️  Found ${issues.length} items to improve.`));
    if (!isFix) console.log(chalk.white(`Run with --fix to scaffold recommended fixes (experimental).`));

    // Simple auto-fix demo based on the flag
    if (isFix) {
       console.log(chalk.green('\n🛠️  Scaffolding fixes (Simulated)...'));
       issues.filter(i => i.severity === 'critical' && i.title.includes('Business logic bypass')).forEach(issue => {
          const expectedFile = 'app/src/main/java/com/example/domain/usecase/GeneratedUseCase.kt';
          console.log(`  ${chalk.green('✓')} Scaffolded: ${expectedFile}`);
          // In real implementation, this would actually generate the file based on the refactor string.
       });
    }

    if (outputFile) {
       let mdOutput = `# MAD Pro Code Review\n\n`;
       if (reviewBranch) mdOutput += `**Target Branch:** \`${reviewBranch}\`\n**Changed Files:** ${fileCount}\n\n`;
       
       mdOutput += `## Issues Found: ${issues.length}\n`;
       issues.forEach(issue => {
          mdOutput += `### ${issue.severity === 'critical' ? '❌' : '⚠️'} ${issue.title}\n`;
          mdOutput += `- **File:** \`${issue.file}:${issue.line}\`\n`;
          mdOutput += `- **Message:** ${issue.message}\n`;
          if (issue.refactor) mdOutput += `- **Refactor:** \n\`\`\`kotlin\n${issue.refactor}\n\`\`\`\n\n`;
       });

       fs.writeFileSync(path.join(rootDir, outputFile), mdOutput);
       console.log(chalk.green(`\nReport saved to ${outputFile}`));
    }
  }
}

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  return index !== -1 ? process.argv[index + 1] : null;
}
