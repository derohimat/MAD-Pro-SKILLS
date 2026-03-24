import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import initCommand from './init.js';

export default async function createCommand(projectName) {
  console.log(chalk.bold.magenta('\n🏗️  MAD Pro - New Project Scaffold'));
  
  if (!projectName) {
    const res = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: 'Enter your project name:',
      default: 'MyMadApp'
    }]);
    projectName = res.name;
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'package',
      message: 'Package Name:',
      default: `com.example.${projectName.toLowerCase()}`
    },
    {
      type: 'list',
      name: 'minSdk',
      message: 'Minimum SDK Version:',
      choices: ['24', '26', '28', '30'],
      default: '26'
    }
  ]);

  const targetDir = path.join(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.error(chalk.red(`Error: Directory ${projectName} already exists!`));
    process.exit(1);
  }

  console.log(chalk.cyan(`\n🔨 Scaffolding project in ${targetDir}...`));

  // 1. Create Base Folders
  const folders = [
    'app/src/main/java/' + answers.package.replace(/\./g, '/'),
    'app/src/main/res/drawable',
    'app/src/main/res/values',
    'gradle/wrapper',
    'references'
  ];

  for (const folder of folders) {
    await fs.ensureDir(path.join(targetDir, folder));
  }

  // 2. Simple Boilerplate Templates
  const packagePath = answers.package.replace(/\./g, '/');
  
  // build.gradle.kts (App level)
  const buildGradle = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
}

android {
    namespace = "${answers.package}"
    compileSdk = 34

    defaultConfig {
        applicationId = "${answers.package}"
        minSdk = ${answers.minSdk}
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.1" }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.compose.ui:ui:1.6.0")
    implementation("com.google.dagger:hilt-android:2.50")
    // MAD Pro: Additional skills will be added via init
}`;

  // MainActivity.kt
  const mainActivity = `package ${answers.package}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Text
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Text(text = "Welcome to MAD Pro Project!")
        }
    }
}`;

  // Writes files
  await fs.writeFile(path.join(targetDir, 'app/build.gradle.kts'), buildGradle);
  await fs.writeFile(path.join(targetDir, 'app/src/main/java/', packagePath, 'MainActivity.kt'), mainActivity);
  await fs.writeFile(path.join(targetDir, 'settings.gradle.kts'), `rootProject.name = "${projectName}"\ninclude(":app")`);

  console.log(chalk.green('✓ Basic structure created.'));

  // 3. Chain to Init Wizard
  console.log(chalk.yellow('\n⏩ Chaining to Skill Wizard for auto-configuration...'));
  
  // Move to target directory to run init correctly
  const originalCwd = process.cwd();
  process.chdir(targetDir);
  
  await initCommand({ ide: 'cursor' });
  
  process.chdir(originalCwd);

  console.log(chalk.bold.green(`\n🚀 Project "${projectName}" is ready!`));
  console.log(chalk.white(`Open this folder in your IDE to start building.`));
}
