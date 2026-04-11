import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadConfig } from '../utils/config.js';

export default async function promptCommand(cmdObj) {
  const rootDir = process.cwd();
  const targetRefDir = path.join(rootDir, 'references');
  const config = loadConfig(rootDir) || { architecture: 'mvvm', di: 'hilt' };

  console.log(chalk.bold.magenta('\n🤖 MAD Pro - Contextual Agent Instruction Generator'));
  
  if (!fs.existsSync(targetRefDir)) {
    console.log(chalk.yellow('\nNo skills found. Run `mad-pro init` first to generate a tailored prompt.'));
    return;
  }

  // Identify installed skills
  const getFiles = (dir) => {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
         if (file !== 'design-tokens') {
            results = results.concat(getFiles(fullPath));
         }
      } else if (file.endsWith('.md')) {
         if (!fullPath.includes('design-tokens')) {
            results.push(path.basename(file, '.md').replace(/_/g, ' ').toUpperCase());
         }
      }
    });
    return results;
  };

  const skills = getFiles(targetRefDir);
  const industryDir = path.join(targetRefDir, 'industry');
  const industrySkills = getFiles(industryDir);

  const archRules = {
      'mvvm': 'Follow MVVM architecture: UI -> ViewModel -> (UseCase) -> Repository -> Data Source.',
      'mvi': 'Follow MVI architecture: UI -> Intent -> ViewModel -> StateFlow -> UI.',
      'mvp': 'Follow MVP architecture: View <-> Presenter -> Repository.',
      'clean+mvi': 'Follow Clean + MVI: UI -> Intent -> ViewModel -> UseCase -> Repository.',
      'viper': 'Follow VIPER architecture: View, Interactor, Presenter, Entity, Router.',
      'custom': 'Follow the custom architecture patterns established in the project.'
  };

  const diRules = {
      'hilt': 'Use Hilt for Dependency Injection (@HiltViewModel, @Inject).',
      'koin': 'Use Koin for Dependency Injection (constructor injection, get()).',
      'none': 'Use manual Dependency Injection.'
  };

  const hasTokens = fs.existsSync(path.join(targetRefDir, 'design-tokens'));

  const formatRes = await inquirer.prompt([{
      type: 'list',
      name: 'format',
      message: 'Select target format:',
      choices: [
          { name: '.cursorrules (Cursor)', value: 'cursor' },
          { name: '.windsurfrules (Windsurf)', value: 'windsurf' },
          { name: 'System Prompt (Clipboard / Generic)', value: 'generic' }
      ]
  }]);

  const promptBuilder = [];
  
  if (formatRes.format !== 'generic') {
     promptBuilder.push(`You are an expert Android Developer using the MAD Pro v1.2.0 framework.`);
     promptBuilder.push(`Your goal is to build highly scalable, testable, and maintainable Android apps.\n`);
  } else {
     promptBuilder.push(`# AI AGENT INSTRUCTIONS (MAD PRO)`);
     promptBuilder.push(`System Role: Expert Android Developer\n`);
  }

  promptBuilder.push(`## PROJECT CONTEXT`);
  promptBuilder.push(`This project uses the following architecture: **${config.architecture.toUpperCase()}** with **${config.di.toUpperCase()}**.`);
  if (skills.length > 0) {
      promptBuilder.push(`Installed architectural patterns in /references:`);
      skills.slice(0, 15).forEach(s => promptBuilder.push(`- ${s}`));
      if (skills.length > 15) promptBuilder.push(`- ...and ${skills.length - 15} more.`);
  }
  promptBuilder.push('');

  promptBuilder.push(`## CORE RULES`);
  promptBuilder.push(`1. ALWAYS check the matching file in /references before implementing a new feature.`);
  promptBuilder.push(`2. ${archRules[config.architecture] || archRules['mvvm']}`);
  promptBuilder.push(`3. ${diRules[config.di] || diRules['hilt']}`);
  promptBuilder.push(`4. Use Jetpack Compose with Unidirectional Data Flow (UDF).`);
  
  if (industrySkills.length > 0) {
      promptBuilder.push(`5. Adhere strictly to the industry best practices found in /references/industry/ for: ${industrySkills.join(', ')}.`);
  }

  promptBuilder.push(`\n## OUTPUT STYLE`);
  promptBuilder.push(`- Provide production-ready Kotlin code.`);
  if (hasTokens) {
      promptBuilder.push(`- STYLING: You MUST use the design tokens defined in /references/design-tokens/ (colors, typography, spacing). Do not hardcode dimensions or generic colors.`);
  }
  promptBuilder.push(`- Ensure all UI components follow the defined Material 3 theme. Avoid outdated XML layouts unless required.`);

  const finalPrompt = promptBuilder.join('\n');

  console.log(chalk.white(`\n--- COPY THIS TO YOUR ${formatRes.format === 'generic' ? 'SYSTEM PROMPT' : formatRes.format === 'cursor' ? '.cursorrules' : '.windsurfrules'} ---\n`));
  console.log(chalk.cyan(finalPrompt));
  console.log(chalk.white('------------------------------------------------------------------\n'));
  
  // Optionally auto-write to file if it's cursor or windsurf
  if (formatRes.format === 'cursor' || formatRes.format === 'windsurf') {
      const fileName = formatRes.format === 'cursor' ? '.cursorrules' : '.windsurfrules';
      const fileRes = await inquirer.prompt([{
          type: 'confirm',
          name: 'write',
          message: `Do you want to write this to ${fileName} in the current directory?`,
          default: true
      }]);
      
      if (fileRes.write) {
          fs.writeFileSync(path.join(rootDir, fileName), finalPrompt);
          console.log(chalk.green(`✓ Saved to ${fileName}`));
      }
  }
}
