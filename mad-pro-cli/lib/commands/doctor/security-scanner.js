import fs from 'fs-extra';
import path from 'path';

export async function runSecurityScan(rootDir) {
  const issues = [];
  
  const ktFiles = [];
  const buildFiles = [];
  
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
         if (!['build', '.gradle', '.idea', 'node_modules'].includes(file)) {
            scanDir(fullPath);
         }
      } else if (fullPath.endsWith('.kt')) {
         ktFiles.push(fullPath);
      } else if (fullPath.endsWith('.gradle.kts') || fullPath.endsWith('.gradle')) {
         buildFiles.push(fullPath);
      }
    }
  }

  scanDir(rootDir);

  for (const file of buildFiles) {
     const relPath = path.relative(rootDir, file);
     const content = fs.readFileSync(file, 'utf8');
     if (content.includes('debuggable true') && content.includes('release {')) {
        issues.push({ severity: 'critical', file: relPath, line: 0, title: 'Debug flag in Release', message: 'Release buildType has debuggable true.', refactor: 'Remove debuggable true or set to false.' });
     }
  }

  for (const file of ktFiles) {
    const relPath = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Hardcoded API Key/Token
      if (line.match(/(val|const val)\s+[A-Z_]+_KEY\s*=\s*"[^"]+"/) || line.match(/=\s*"Bearer\s+[^"]+"/)) {
         issues.push({
             severity: 'critical', file: relPath, line: index + 1,
             title: 'Hardcoded API Key / Secret',
             message: 'Hardcoded secret detected.',
             refactor: 'Use BuildConfig or BuildConfig field from local.properties/CI environment.'
         });
      }

      // HTTP endpoint
      if (line.match(/baseUrl\s*=\s*"http:\/\//)) {
         issues.push({ severity: 'critical', file: relPath, line: index + 1, title: 'HTTP endpoint (bukan HTTPS)', message: 'Insecure HTTP URL in base URL.', refactor: 'Use https:// instead.' });
      }

      // Unencrypted SharedPreferences
      if (line.includes('getSharedPreferences') && (line.toLowerCase().includes('token') || line.toLowerCase().includes('password'))) {
         issues.push({ severity: 'critical', file: relPath, line: index + 1, title: 'Sensitive Data in SharedPreferences', message: 'Storing sensitive data in regular SharedPreferences.', refactor: 'Use EncryptedSharedPreferences (Security Crypto library).' });
      }

      // Log expose
      if (line.match(/Log\.[deiwv]\([^,]+,\s*[a-zA-Z]*(token|password|secret)[a-zA-Z]*\)/i)) {
         issues.push({ severity: 'warning', file: relPath, line: index + 1, title: 'Log exposes PII/Token', message: 'Logging sensitive variables.', refactor: 'Remove log statement or mask the value.' });
      }
      
      // GlobalScope warning
      if (line.includes('GlobalScope.launch')) {
         issues.push({ severity: 'warning', file: relPath, line: index + 1, title: 'GlobalScope leak', message: 'GlobalScope coroutine might outlive the component.', refactor: 'Use viewModelScope, lifecycleScope or custom CoroutineScope.' });
      }
      
      // World Readable
      if (line.includes('MODE_WORLD_READABLE')) {
         issues.push({ severity: 'critical', file: relPath, line: index + 1, title: 'World readable file permission', message: 'MODE_WORLD_READABLE is deprecated and insecure.', refactor: 'Use MODE_PRIVATE' });
      }
    });

    // Check BroadcastReceiver
    if (content.includes('registerReceiver(')) {
       if (!content.includes('unregisterReceiver(')) {
          issues.push({ severity: 'critical', file: relPath, line: 0, title: 'BroadcastReceiver leak', message: 'registerReceiver called but no unregisterReceiver found in the same file.', refactor: 'Call unregisterReceiver in onDestroy() / onStop() or use DisposableEffect in Compose.' });
       }
    }
    
    // Bitmap recycle warning
    if (content.includes('Bitmap.create') && !content.includes('.recycle()')) {
       issues.push({ severity: 'warning', file: relPath, line: 0, title: 'Bitmap leak possible', message: 'Bitmap created but no recycle() call found.', refactor: 'Ensure bitmaps are recycled when no longer needed.' });
    }
  }

  return issues;
}
