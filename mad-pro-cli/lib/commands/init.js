import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function initCommand(options) {
  const targetDir = process.cwd();
  const aiName = options.ai || 'antigravity';

  console.log(chalk.blue(`Initializing project with ${aiName} skills...`));

  if (aiName === 'antigravity') {
    try {
      const ide = options.ide || 'vscode';
      
      // Mapping IDE to destination path
      const idePaths = {
        'vscode': path.join('.agent', 'skills', 'mad-skills'),
        'code-insiders': path.join('.agent', 'skills', 'mad-skills'),
        'cursor': path.join('.cursor', 'skills', 'mad-skills'),
        'windsurf': path.join('.windsurf', 'skills', 'mad-skills'),
        'android-studio': path.join('.idea', 'skills', 'mad-skills'),
        'intellij': path.join('.idea', 'skills', 'mad-skills'),
        'sublime': path.join('.sublime', 'skills', 'mad-skills'),
        'vim': path.join('.vim', 'skills', 'mad-skills'),
        'neovim': path.join('.vim', 'skills', 'mad-skills'),
        'zed': path.join('.zed', 'skills', 'mad-skills'),
        'antigravity': path.join('.agent', 'skills', 'mad-skills'),
        'fleet': path.join('.fleet', 'skills', 'mad-skills'),
        'nova': path.join('.nova', 'skills', 'mad-skills'),
        'xcode': path.join('Xcode', 'skills', 'mad-skills'),
        'webstorm': path.join('.idea', 'skills', 'mad-skills')
      };

      const relativeDestPath = idePaths[ide.toLowerCase()] || idePaths['vscode'];
      const destinationPath = path.join(targetDir, relativeDestPath);
      const sourceSkillsPath = path.resolve(__dirname, '../../templates/mad-skills');

      console.log(chalk.yellow(`Installing skills for ${chalk.bold(ide)} to ${destinationPath}...`));

      await fs.ensureDir(destinationPath);
      
      // Copy SKILL.md
      await fs.copy(path.join(sourceSkillsPath, 'SKILL.md'), path.join(destinationPath, 'SKILL.md'));
      
      // Copy references directory
      await fs.copy(path.join(sourceSkillsPath, 'references'), path.join(destinationPath, 'references'));

      console.log(chalk.green('\n✅ Success! MAD Skills (Antigravity Bridge) installed.'));
      console.log(chalk.cyan(`\nYour AI agent (Antigravity) can now find these skills at: ${destinationPath}`));
      console.log(chalk.gray('\nTo use these skills, make sure your agent is instructed to read the .agent/skills directory.'));

    } catch (error) {
      console.error(chalk.red('\n❌ Error installing skills:'), error.message);
    }
  } else {
    console.log(chalk.red(`\n❌ Unknown AI bridge: ${aiName}`));
    console.log(chalk.gray('Available bridges: antigravity'));
  }
}
