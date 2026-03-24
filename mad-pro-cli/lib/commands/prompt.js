import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export default async function promptCommand() {
  const rootDir = process.cwd();
  const targetRefDir = path.join(rootDir, 'references');

  console.log(chalk.bold.magenta('\n🤖 MAD Pro - Agent Instruction Generator'));
  
  if (!fs.existsSync(targetRefDir)) {
    console.log(chalk.yellow('\nNo skills found. Run `mad-pro init` first to generate a tailored prompt.'));
    return;
  }

  // Identify installed skills
  const getFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        results = results.concat(getFiles(fullPath));
      } else if (file.endsWith('.md')) {
        results.push(path.basename(file, '.md').replace(/_/g, ' ').toUpperCase());
      }
    });
    return results;
  };

  const skills = getFiles(targetRefDir);

  const prompt = `
# AI AGENT INSTRUCTIONS (MAD PRO)
You are an expert Android Developer using the MAD Pro v1.2.0 framework.
Your goal is to build highly scalable, testable, and maintainable Android apps.

## PROJECT CONTEXT
This project has the following architectural patterns installed in /references:
${skills.map(s => `- ${s}`).join('\n')}

## CORE RULES
1. ALWAYS check the matching file in /references before implementing a new feature.
2. Follow Clean Architecture: UI -> Domain -> Data layers.
3. Use Hilt for Dependency Injection.
4. Use Jetpack Compose with Unidirectional Data Flow (UDF).
5. If a requested industry pattern (e.g., Banking, E-commerce) exists in /references/industry, adhere strictly to its security and structure guidelines.

## OUTPUT STYLE
- Provide production-ready Kotlin code.
- Include KDoc for public functions.
- Ensure all UI components follow the defined Material 3 theme.
`;

  console.log(chalk.white('\n--- COPY THE TEXT BELOW TO YOUR SYSTEM PROMPT / .cursorrules ---\n'));
  console.log(chalk.cyan(prompt));
  console.log(chalk.white('------------------------------------------------------------------\n'));
}
