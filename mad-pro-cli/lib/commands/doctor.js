import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export default async function doctorCommand() {
  console.log(chalk.bold.magenta('\n🩺 MAD Pro Doctor - Project Audit'));
  console.log(chalk.gray('Checking your project for architectural health...\n'));

  const rootDir = process.cwd();
  
  const checks = [
    { name: 'MAD Pro Initialization', path: 'references/', type: 'dir', critical: true, help: 'Run `mad-pro init` to install base skills.' },
    { name: 'Skill Master Index', path: 'references/SKILL.md', type: 'file', critical: false, help: 'Master index (SKILL.md) is missing. This weakens AI context.' },
    { name: 'Clean Arch: UI Layer', path: 'app/src/main/java/', type: 'dir', contains: 'ui', critical: false, help: 'Missing "ui" package. Conventional MAD apps should have it.' },
    { name: 'Clean Arch: Data Layer', path: 'app/src/main/java/', type: 'dir', contains: 'data', critical: false, help: 'Missing "data" package. Offline-first apps need a data source.' },
    { name: 'Hilt Dependency Injection', path: 'app/build.gradle.kts', type: 'content', contains: 'dagger.hilt', critical: false, help: 'Consider using Hilt for easier dependency management.' },
  ];

  let issues = 0;

  for (const check of checks) {
    let passed = false;
    const fullPath = path.join(rootDir, check.path);

    if (check.type === 'dir') {
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        if (check.contains) {
          passed = findFolderRecursive(fullPath, check.contains);
        } else {
          passed = true;
        }
      }
    } else if (check.type === 'file') {
      passed = fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
    } else if (check.type === 'content') {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        passed = content.includes(check.contains);
      }
    }

    if (passed) {
      console.log(`${chalk.green('✓')} ${check.name}`);
    } else {
      issues++;
      const prefix = check.critical ? chalk.red('❌') : chalk.yellow('⚠️');
      console.log(`${prefix} ${check.name}`);
      console.log(chalk.gray(`   💡 Recommendation: ${check.help}`));
    }
  }

  if (issues === 0) {
    console.log(chalk.bold.green('\n🎉 Your project looks 100% MAD-compliant!'));
  } else {
    console.log(chalk.bold.yellow(`\n⚠️  Found ${issues} items to improve.`));
  }
}

function findFolderRecursive(startDir, targetName) {
  const files = fs.readdirSync(startDir);
  for (const file of files) {
    const fullPath = path.join(startDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file.toLowerCase() === targetName.toLowerCase()) return true;
      if (findFolderRecursive(fullPath, targetName)) return true;
    }
  }
  return false;
}
