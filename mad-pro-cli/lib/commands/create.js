import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import initCommand from './init.js';

export default async function createCommand(projectName) {
  console.log(chalk.bold.magenta('\n🏗️  MAD Pro - New Project Scaffold'));
  console.log(chalk.gray('Generate a production-ready Android/KMP project.\n'));

  if (!projectName) {
    const res = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: 'MyMadApp',
      validate: v => /^[A-Za-z][A-Za-z0-9]*$/.test(v) || 'Must start with a letter, alphanumeric only.'
    }]);
    projectName = res.name;
  }

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'templateType',
      message: 'Select Template:',
      choices: [
        { name: 'KrossWave KMP (Recommended - Multi-module, KMP, Koin, Voyager)', value: 'kmp' },
        { name: 'Basic Android (Single module, Hilt, Navigation Compose)', value: 'basic' }
      ]
    },
    {
      type: 'input',
      name: 'package',
      message: 'Package name:',
      default: `com.example.${projectName.toLowerCase()}`,
      validate: v => /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(v) || 'Invalid package (e.g. com.example.app)'
    }
  ]);

  let basicAnswers = {};
  if (answers.templateType === 'basic') {
      basicAnswers = await inquirer.prompt([
        {
          type: 'list',
          name: 'minSdk',
          message: 'Minimum SDK:',
          choices: ['24', '26', '28', '30'],
          default: '26'
        },
        {
          type: 'list',
          name: 'targetSdk',
          message: 'Target SDK:',
          choices: ['34', '35'],
          default: '35'
        }
      ]);
  }

  const targetDir = path.join(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.error(chalk.red(`\n❌ Directory "${projectName}" already exists.`));
    process.exit(1);
  }

  const pkg = answers.package;
  const pkgPath = pkg.replace(/\./g, '/');

  if (answers.templateType === 'kmp') {
    console.log(chalk.cyan(`\n🔨 Cloning KrossWave KMP template...\n`));
    try {
      execSync(`git clone --depth 1 https://github.com/derohimat/android-kmp-starter.git "${projectName}"`, { stdio: 'inherit' });
      await fs.remove(path.join(targetDir, '.git'));
      console.log(`  ${chalk.green('✓')} Template cloned successfully`);
      
      console.log(chalk.cyan(`\n🔨 Customizing package name to ${pkg}...\n`));
      const oldPkg = 'com.derohimat.krosswave';
      const oldAppName = 'KrossWave'; // typical app name in that repo
      
      async function processFolder(dir) {
        const files = await fs.readdir(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = await fs.stat(fullPath);
          
          if (stat.isDirectory()) {
            await processFolder(fullPath);
          } else {
            const ext = path.extname(fullPath);
            const validExts = ['.kt', '.xml', '.gradle', '.kts', '.pro', '.properties', '.toml', '.md'];
            if (validExts.includes(ext) || file === 'gradlew' || file === 'gradlew.bat') {
              try {
                let content = await fs.readFile(fullPath, 'utf8');
                let modified = false;
                
                if (content.includes(oldPkg)) {
                   content = content.replace(new RegExp(oldPkg, 'g'), pkg);
                   modified = true;
                }
                if (content.includes(oldAppName)) {
                   content = content.replace(new RegExp(oldAppName, 'g'), projectName);
                   modified = true;
                }
                
                if (modified) {
                   await fs.writeFile(fullPath, content, 'utf8');
                }
              } catch (e) {
                 // ignore read errors on binary files
              }
            }
          }
        }
      }

      await processFolder(targetDir);
      
      async function restructureDirs(currentDir) {
          const items = await fs.readdir(currentDir);
          for (const item of items) {
              const fullPath = path.join(currentDir, item);
              if ((await fs.stat(fullPath)).isDirectory()) {
                  if (fullPath.endsWith(path.join('com', 'derohimat', 'krosswave'))) {
                      const newPath = fullPath.replace(path.join('com', 'derohimat', 'krosswave'), path.join(...pkg.split('.')));
                      await fs.move(fullPath, newPath, { overwrite: true });
                      
                      const derohimatDir = path.dirname(fullPath);
                      const comDir = path.dirname(derohimatDir);
                      try {
                          await fs.rmdir(derohimatDir);
                          await fs.rmdir(comDir);      
                      } catch(e) { }
                  } else {
                      await restructureDirs(fullPath);
                  }
              }
          }
      }
      await restructureDirs(targetDir);
      
      console.log(`  ${chalk.green('✓')} Package renamed to ${pkg}`);
      console.log(`  ${chalk.green('✓')} App name updated to ${projectName}\n`);

    } catch (e) {
      console.error(chalk.red(`\n❌ Failed to clone or process template: ${e.message}`));
      process.exit(1);
    }
  } else {
    // Generate Basic Android (existing logic)
    console.log(chalk.cyan(`\n🔨 Generating Basic Android project structure...\n`));
    
    const compileSdk = basicAnswers.targetSdk;
    const minSdk = basicAnswers.minSdk;
    const targetSdk = basicAnswers.targetSdk;

    const dirs = [
      `app/src/main/java/${pkgPath}`,
      `app/src/main/java/${pkgPath}/ui/theme`,
      `app/src/main/java/${pkgPath}/ui/navigation`,
      `app/src/main/java/${pkgPath}/ui/screens/home`,
      `app/src/main/java/${pkgPath}/domain/model`,
      `app/src/main/java/${pkgPath}/domain/usecase`,
      `app/src/main/java/${pkgPath}/domain/repository`,
      `app/src/main/java/${pkgPath}/data/repository`,
      `app/src/main/java/${pkgPath}/data/remote`,
      `app/src/main/java/${pkgPath}/data/local`,
      `app/src/main/java/${pkgPath}/di`,
      `app/src/main/res/drawable`,
      `app/src/main/res/values`,
      `app/src/main/res/mipmap-hdpi`,
      `app/src/test/java/${pkgPath}`,
      `app/src/androidTest/java/${pkgPath}`,
      `gradle/wrapper`,
    ];

    for (const d of dirs) {
      await fs.ensureDir(path.join(targetDir, d));
    }

    const files = {};
    files['build.gradle.kts'] = `// Top-level build file
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.hilt.android) apply false
    alias(libs.plugins.ksp) apply false
}
`;

    files['settings.gradle.kts'] = `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${projectName}"
include(":app")
`;

    files['gradle/libs.versions.toml'] = `[versions]
agp = "8.7.3"
kotlin = "2.1.0"
ksp = "2.1.0-1.0.29"
coreKtx = "1.15.0"
lifecycle = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.12.01"
hilt = "2.53.1"
hiltNavCompose = "1.2.0"
navigation = "2.8.5"
coroutines = "1.9.0"
junit = "4.13.2"
junitExt = "1.2.1"
espresso = "3.6.1"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycle" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycle" }
androidx-lifecycle-runtime-compose = { group = "androidx.lifecycle", name = "lifecycle-runtime-compose", version.ref = "lifecycle" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigation" }
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-compiler = { group = "com.google.dagger", name = "hilt-compiler", version.ref = "hilt" }
hilt-navigation-compose = { group = "androidx.hilt", name = "hilt-navigation-compose", version.ref = "hiltNavCompose" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitExt" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espresso" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
hilt-android = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
`;

    files['app/build.gradle.kts'] = `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt.android)
    alias(libs.plugins.ksp)
}

android {
    namespace = "${pkg}"
    compileSdk = ${compileSdk}

    defaultConfig {
        applicationId = "${pkg}"
        minSdk = ${minSdk}
        targetSdk = ${targetSdk}
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // Core
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.activity.compose)

    // Compose
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)

    // Navigation
    implementation(libs.androidx.navigation.compose)

    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    debugImplementation(libs.androidx.ui.tooling)
}
`;

    files['gradle.properties'] = `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.caching=true
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`;

    files['gradle/wrapper/gradle-wrapper.properties'] = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.9-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;

    files['app/src/main/AndroidManifest.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:name=".${projectName}Application"
        android:allowBackup=true
        android:icon="@mipmap/ic_launcher"
        android:label="${projectName}"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`;

    files[`app/src/main/java/${pkgPath}/${projectName}Application.kt`] = `package ${pkg}

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class ${projectName}Application : Application()
`;

    files[`app/src/main/java/${pkgPath}/MainActivity.kt`] = `package ${pkg}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import ${pkg}.ui.navigation.AppNavHost
import ${pkg}.ui.theme.${projectName}Theme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ${projectName}Theme {
                AppNavHost()
            }
        }
    }
}
`;

    files[`app/src/main/java/${pkgPath}/ui/theme/Color.kt`] = `package ${pkg}.ui.theme

import androidx.compose.ui.graphics.Color

val Purple80 = Color(0xFFD0BCFF)
val PurpleGrey80 = Color(0xFFCCC2DC)
val Pink80 = Color(0xFFEFB8C8)

val Purple40 = Color(0xFF6650a4)
val PurpleGrey40 = Color(0xFF625b71)
val Pink40 = Color(0xFF7D5260)
`;

    files[`app/src/main/java/${pkgPath}/ui/theme/Type.kt`] = `package ${pkg}.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    displayLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 57.sp,
        lineHeight = 64.sp,
        letterSpacing = (-0.25).sp
    ),
    headlineMedium = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 28.sp,
        lineHeight = 36.sp
    ),
    bodyLarge = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    labelSmall = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    )
)
`;

    files[`app/src/main/java/${pkgPath}/ui/theme/Theme.kt`] = `package ${pkg}.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = Purple80,
    secondary = PurpleGrey80,
    tertiary = Pink80
)

private val LightColorScheme = lightColorScheme(
    primary = Purple40,
    secondary = PurpleGrey40,
    tertiary = Pink40
)

@Composable
fun ${projectName}Theme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
`;

    files[`app/src/main/java/${pkgPath}/ui/navigation/AppNavHost.kt`] = `package ${pkg}.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import ${pkg}.ui.screens.home.HomeScreen

@Composable
fun AppNavHost() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen()
        }
    }
}
`;

    files[`app/src/main/java/${pkgPath}/ui/screens/home/HomeScreen.kt`] = `package ${pkg}.ui.screens.home

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(viewModel: HomeViewModel = hiltViewModel()) {
    Scaffold(
        topBar = {
            TopAppBar(title = { Text("${projectName}") })
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Welcome to ${projectName}!",
                style = MaterialTheme.typography.headlineMedium
            )
        }
    }
}
`;

    files[`app/src/main/java/${pkgPath}/ui/screens/home/HomeViewModel.kt`] = `package ${pkg}.ui.screens.home

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor() : ViewModel()
`;

    files[`app/src/main/java/${pkgPath}/di/AppModule.kt`] = `package ${pkg}.di

import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    // Provide your app-wide dependencies here
}
`;

    files['app/src/main/res/values/strings.xml'] = `<resources>
    <string name="app_name">${projectName}</string>
</resources>
`;

    files['app/src/main/res/values/colors.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
</resources>
`;

    files['app/proguard-rules.pro'] = `# Add project specific ProGuard rules here.
# -keep class ${pkg}.data.remote.dto.** { *; }
`;

    files['.gitignore'] = `*.iml
.gradle
/local.properties
/.idea
.DS_Store
/build
/captures
.externalNativeBuild
.cxx
local.properties
`;

    let fileCount = 0;
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(targetDir, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content);
      fileCount++;
    }

    console.log(`  ${chalk.green('✓')} Generated ${fileCount} files.`);
  }

  // ── Chain to Skill Wizard ───────────────────────────────
  console.log(chalk.yellow('\n⏩ Launching Skill Wizard...\n'));

  const originalCwd = process.cwd();
  process.chdir(targetDir);
  await initCommand({});
  process.chdir(originalCwd);

  console.log(chalk.bold.green(`\n🚀 Project "${projectName}" is ready!`));
  console.log(chalk.white(`\n  cd ${projectName}`));
  
  if (answers.templateType === 'kmp') {
    console.log(chalk.white(`  ./gradlew composeApp:run\n`));
  } else {
    console.log(chalk.white(`  ./gradlew assembleDebug\n`));
  }
}
