import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export async function runArchitectureCheck(rootDir, config) {
  const issues = [];
  const arch = config.architecture || 'mvvm';
  const di = config.di || 'hilt';

  // Helper to scan files
  const ktFiles = [];
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
         // Skip build and generated dirs
         if (!['build', '.gradle', '.idea', 'node_modules'].includes(file)) {
            scanDir(fullPath);
         }
      } else if (fullPath.endsWith('.kt')) {
         ktFiles.push(fullPath);
      }
    }
  }

  scanDir(rootDir);

  let hasDomainLayer = false;
  let hasUiLayer = false;
  let hasDataLayer = false;

  for (const file of ktFiles) {
    const relPath = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');

    // Layer checks
    if (relPath.includes('/domain/') || relPath.includes('/usecase/')) hasDomainLayer = true;
    if (relPath.includes('/ui/') || relPath.includes('/presentation/')) hasUiLayer = true;
    if (relPath.includes('/data/')) hasDataLayer = true;

    const lines = content.split('\n');

    // God class check
    if (lines.length > 300) {
      issues.push({
        severity: 'warning',
        file: relPath,
        line: 1,
        title: 'God-class detected',
        message: 'File is over 300 lines. Consider splitting into smaller classes/composables.'
      });
    }

    // Specific file type checks based on content
    const isViewModel = content.includes('ViewModel()') || file.endsWith('ViewModel.kt') || content.includes('class ') && content.includes('ViewModel');
    const isActivityOrFragment = content.includes('class ') && (content.includes(' : AppCompatActivity') || content.includes(' : ComponentActivity') || content.includes(' : Fragment'));

    // Activity logic check
    if (isActivityOrFragment) {
      if (arch !== 'custom' && (content.includes('viewModelScope') || content.includes('Retrofit') || content.includes('Dao'))) {
        issues.push({
          severity: 'critical',
          file: relPath,
          line: lines.findIndex(l => l.includes('Retrofit') || l.includes('Dao') || l.includes('viewModelScope')) + 1 || 1,
          title: `Logic in Activity/Fragment (${arch.toUpperCase()})`,
          message: `Migrate logic to ViewModel or ${arch === 'viper' ? 'Interactor' : 'UseCase'}`,
          refactor: `Ensure setContent { } wraps your NavHost, no logic in Activity`
        });
      }
    }

    if (isViewModel) {
      // Missing DI check
      if (di === 'hilt' && !content.includes('@HiltViewModel')) {
        issues.push({ severity: 'warning', file: relPath, line: 1, title: 'Missing @HiltViewModel', message: 'Add @HiltViewModel to use Hilt DI.' });
      } else if (di === 'koin' && !content.includes('@KoinViewModel') && !content.includes('viewModel {')) {
         // Koin usually defined in module, but annotations exist in Koin annotations
      }

      // Bypass UseCase check (Directly injecting Repository)
      if (['mvi', 'clean+mvi', 'viper'].includes(arch)) {
        const repoInjectMatch = content.match(/val\s+[a-zA-Z0-9_]+Repository\s*:/);
        if (repoInjectMatch) {
          issues.push({
            severity: 'critical',
            file: relPath,
            line: lines.findIndex(l => l.includes(repoInjectMatch[0])) + 1,
            title: 'Business logic bypass detected',
            message: `Direct usage of Repository in ViewModel. Expected UseCase/Interactor in ${arch.toUpperCase()}`,
            refactor: `class MyUseCase @Inject constructor(private val repo: Repository) { operator fun invoke() = repo.exec() }\nInject MyUseCase instead.`
          });
        }
      }

      // MVI Checks
      if (['mvi', 'clean+mvi'].includes(arch)) {
         if (!content.includes('StateFlow') && !content.includes('UiState')) {
            issues.push({ severity: 'critical', file: relPath, line: 1, title: 'Missing StateFlow/UiState', message: 'MVI requires state management via StateFlow.' });
         }
         if (!content.includes('Intent') && !content.includes('Action') && !content.includes('Event')) {
            issues.push({ severity: 'critical', file: relPath, line: 1, title: 'Missing Intent/Action', message: 'MVI expects explicit Intents or Actions.' });
         }
      }
    }

    // `runBlocking` in main thread (generic check)
    lines.forEach((line, index) => {
      if (line.includes('runBlocking')) {
         issues.push({
            severity: 'critical',
            file: relPath,
            line: index + 1,
            title: 'runBlocking detected',
            message: 'Avoid runBlocking in production code as it blocks the thread.',
            refactor: 'Replace with viewModelScope.launch or lifecycleScope.launch'
         });
      }
      
      // Hardcoded string (naive check inside composables / classes)
      if (line.match(/Text\(\s*"[^"]+"\s*\)/)) {
        issues.push({
          severity: 'warning',
          file: relPath,
          line: index + 1,
          title: 'Hardcoded string in UI',
          message: 'Found hardcoded string in Text().',
          refactor: 'Move to res/values/strings.xml and use stringResource(R.string.id)'
        });
      }
    });
  }

  if (!hasDomainLayer && ['clean+mvi', 'viper'].includes(arch)) {
     issues.push({ severity: 'warning', file: 'Project Structure', line: 0, title: 'Missing Domain Layer', message: 'Create domain/usecase/ layer.' });
  }

  return issues;
}
