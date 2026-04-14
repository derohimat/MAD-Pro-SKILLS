import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function initCommand(options) {
  console.log(chalk.bold.magenta('\n🚀 MAD Pro CLI - Skill Wizard v1.3.0'));
  console.log(chalk.gray('Setting up your Android project with architecture excellence...\n'));

  // 1. Identify Source & Target
  const rootDir = process.cwd();
  const sourceDir = path.join(__dirname, '../../../references');

  // Verify source exists
  if (!fs.existsSync(sourceDir)) {
    console.error(chalk.red('Error: Skill library not found. Please reinstall the CLI.'));
    process.exit(1);
  }

  // 2. Interactive Prompts
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'ide',
      message: 'Which IDE are you using?',
      choices: [
        { name: 'Cursor (Highly Recommended)', value: 'cursor' },
        { name: 'Windsurf', value: 'windsurf' },
        { name: 'VS Code', value: 'vscode' },
        { name: 'Android Studio', value: 'android-studio' },
        { name: 'Zed', value: 'zed' },
        { name: 'Others', value: 'default' }
      ],
      default: options.ide || 'cursor'
    },
    {
      type: 'checkbox',
      name: 'categories',
      message: 'Select Skill Categories to include:',
      choices: [
        { name: 'Core MAD (UI, Domain, Data Layers)', value: 'core', checked: true },
        { name: 'Platform Capabilities (Camera, Biometrics, etc.)', value: 'platform', checked: true },
        { name: 'AI & Emerging (Gemini, LLM UI, ARCore)', value: 'ai', checked: false },
        { name: 'Industry Verticals (Banking, E-commerce, etc.)', value: 'industry', checked: false },
        { name: 'Monetization & Play (Billing, Subs)', value: 'monetization', checked: false },
        { name: 'Engineering Excellence (Modularization, CI/CD)', value: 'engineering', checked: false },
        { name: 'Design Tokens (Colors, Typography, Spacing)', value: 'tokens', checked: true }
      ]
    }
  ]);

  // 3. Selective Industry prompt (only if 'industry' is selected)
  let selectedIndustries = [];
  if (answers.categories.includes('industry')) {
    const industryPath = path.join(sourceDir, 'industry');
    const allIndustries = fs.readdirSync(industryPath).filter(f => f.endsWith('.md') && f !== 'google_play_subscriptions.md' && f !== 'in_app_payments.md');

    const industryChoices = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'industries',
        message: 'Which Industry Verticals do you need?',
        choices: allIndustries.map(f => ({ name: f.replace('.md', '').replace(/_/g, ' ').toUpperCase(), value: f }))
      }
    ]);
    selectedIndustries = industryChoices.industries;
  }

  // 4. Create Target Directories
  const targetRefDir = path.join(rootDir, 'references');
  const targetIndustryDir = path.join(targetRefDir, 'industry');
  const targetTokenDir = path.join(targetRefDir, 'design-tokens');
  await fs.ensureDir(targetRefDir);
  if (selectedIndustries.length > 0 || answers.categories.includes('monetization')) {
    await fs.ensureDir(targetIndustryDir);
  }
  if (answers.categories.includes('tokens')) {
    await fs.ensureDir(targetTokenDir);
  }

  // 5. Build Mapping & Copy Files
  const skillMapping = {
    'core': [
      'ui_layer_state.md', 'ui_patterns.md', 'ui_layouts.md', 'ui_modifiers.md', 'ui_theming.md', 'ui_navigation.md',
      'domain_layer_use_case.md', 'data_layer_room.md', 'data_layer_networking.md', 'data_layer_serialization.md'
    ],
    'platform': [
      'camera_media.md', 'barcode_qr.md', 'image_editing.md', 'voice_speech.md', 'biometric_auth.md', 'security.md',
      'maps_location.md', 'push_notifications.md', 'widget_glance.md', 'app_shortcuts.md'
    ],
    'ai': ['gemini_api.md', 'llm_ui_patterns.md', 'ar_core.md', 'on_device_ai.md'],
    'monetization': ['industry/in_app_payments.md', 'industry/google_play_subscriptions.md'],
    'engineering': [
      'modularization.md', 'architecture_di.md', 'concurrency.md', 'performance.md', 'testing.md',
      'design_systems.md', 'observability.md', 'ci_cd.md'
    ],
    'tokens': ['design-tokens/color-tokens.md', 'design-tokens/typography-tokens.md', 'design-tokens/spacing-tokens.md']
  };

  let filesToCopy = [];
  answers.categories.forEach(cat => {
    if (skillMapping[cat]) {
      filesToCopy = [...filesToCopy, ...skillMapping[cat]];
    }
  });

  // Add individual industry files
  selectedIndustries.forEach(industryFile => {
    filesToCopy.push(`industry/${industryFile}`);
  });

  // Always include the master index but pruned
  filesToCopy.push('../SKILL.md');

  // Perform Copying
  console.log(chalk.cyan('\n📦 Installing selected skills...'));
  
  for (const file of filesToCopy) {
    const src = path.join(sourceDir, file);
    const destName = file.includes('industry/') ? file.replace('industry/', 'industry/') : (file.includes('design-tokens/') ? file.replace('design-tokens/', 'design-tokens/') : file);
    const dest = path.join(targetRefDir, destName);
    
    if (fs.existsSync(src)) {
      await fs.copy(src, dest);
      console.log(`${chalk.green('✓')} Added ${chalk.gray(destName)}`);
    }
  }

  // 6. Project Configuration (IDE Specific)
  await configureIDE(answers.ide, rootDir);

  console.log(chalk.bold.green('\n🎉 Setup Complete!'));
  console.log(chalk.white(`Configured IDE: ${chalk.bold.yellow(answers.ide.toUpperCase())}`));
  console.log(chalk.white(`Skills Installed: ${chalk.bold.yellow(filesToCopy.length - 1)} items`));
  console.log(chalk.gray('\nYour AI Agent is now ready with expert context. Happy coding! 🚀\n'));
}

async function configureIDE(ide, rootDir) {
  const configFiles = {
    'cursor': { file: '.cursorrules', content: 'Use the patterns in the /references directory for all Android work.' },
    'windsurf': { file: '.windsurf/rules', content: 'Follow MAD Pro architecture in /references folder.' },
    'vscode': { file: '.vscode/settings.json', content: '{\n  "android.skillPath": "./references"\n}' }
  };

  const config = configFiles[ide];
  if (config) {
    const targetFile = path.join(rootDir, config.file);
    await fs.ensureDir(path.dirname(targetFile));
    await fs.writeFile(targetFile, config.content);
    console.log(`${chalk.blue('ℹ')} Created IDE config: ${chalk.gray(config.file)}`);
  }
}
