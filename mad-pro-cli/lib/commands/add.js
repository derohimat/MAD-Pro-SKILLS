import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function addCommand() {
  console.log(chalk.bold.magenta('\n📥 MAD Pro CLI - Add Skills'));
  console.log(chalk.gray('Search and install specific skills to your project...\n'));

  const rootDir = process.cwd();
  const sourceDir = path.join(__dirname, '../../../references');

  if (!fs.existsSync(sourceDir)) {
    console.error(chalk.red('Error: Skill library not found. Please reinstall the CLI.'));
    process.exit(1);
  }

  // 1. Get all available skills
  const coreFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));
  const industryPath = path.join(sourceDir, 'industry');
  const industryFiles = fs.readdirSync(industryPath).filter(f => f.endsWith('.md')).map(f => `industry/${f}`);

  const allSkills = [...coreFiles, ...industryFiles].map(f => ({
    name: f.replace('.md', '').replace(/_/g, ' ').toUpperCase(),
    value: f
  })).sort((a, b) => a.name.localeCompare(b.name));

  // 2. Interactive Selection (Searchable)
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'skills',
      message: 'Search and select skills to add:',
      choices: allSkills,
      pageSize: 15
    }
  ]);

  if (answers.skills.length === 0) {
    console.log(chalk.yellow('\nNo skills selected. Exit.'));
    return;
  }

  // 3. Perform Copying
  const targetRefDir = path.join(rootDir, 'references');
  const targetIndustryDir = path.join(targetRefDir, 'industry');
  await fs.ensureDir(targetRefDir);
  await fs.ensureDir(targetIndustryDir);

  console.log(chalk.cyan('\n📦 Adding selected skills...'));

  for (const skill of answers.skills) {
    const src = path.join(sourceDir, skill);
    const dest = path.join(targetRefDir, skill);
    
    if (fs.existsSync(src)) {
      await fs.copy(src, dest);
      console.log(`${chalk.green('✓')} Added ${chalk.gray(skill)}`);
    }
  }

  console.log(chalk.bold.green(`\n🎉 Successfully added ${answers.skills.length} skills!`));
  console.log(chalk.gray('Your AI Agent can now use these additional patterns.\n'));
}
