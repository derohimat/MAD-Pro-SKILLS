import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export default async function listCommand() {
  const rootDir = process.cwd();
  const targetRefDir = path.join(rootDir, 'references');

  console.log(chalk.bold.magenta('\n📋 MAD Pro Installed Skills'));

  if (!fs.existsSync(targetRefDir)) {
    console.log(chalk.yellow('\nNo skills initialized in this project. Run `mad-pro init` first.'));
    return;
  }

  const getFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFiles(fullPath));
      } else if (file.endsWith('.md')) {
        results.push(path.relative(targetRefDir, fullPath));
      }
    });
    return results;
  };

  const installed = getFiles(targetRefDir);

  if (installed.length === 0) {
    console.log(chalk.gray('Zero skills found in /references directory.'));
  } else {
    installed.sort().forEach(file => {
      console.log(`${chalk.green('✓')} ${file.replace('.md', '').toUpperCase().replace(/_/g, ' ')}`);
    });
    console.log(chalk.cyan(`\nTotal: ${installed.length} skills active.`));
  }
  console.log("");
}
