import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { runArchitectureCheck } from './architecture-checker.js';
import { runSecurityScan } from './security-scanner.js';

export async function runDiffReview(rootDir, targetBranch, config, doSecurity) {
  let changedFiles = [];
  try {
    const output = execSync(`git diff ${targetBranch}...HEAD --name-only`, { cwd: rootDir, encoding: 'utf8' });
    changedFiles = output.split('\n').map(l => l.trim()).filter(l => l.length > 0 && l.endsWith('.kt'));
  } catch (e) {
    throw new Error(`Failed to get git diff vs ${targetBranch}. Ensure it exists locally and project is a git repo.`);
  }

  if (changedFiles.length === 0) return { files: 0, issues: [] };

  // Collect all issues from architecture check and security scan
  // Usually they scan the whole dir, but for this we might need to filter.
  // Wait, the arch checker scans the dir recursively. 
  // For diff review, we can just run the scanners recursively and then filter the output by the changed files list.
  
  const archIssues = await runArchitectureCheck(rootDir, config);
  const securityIssues = doSecurity ? await runSecurityScan(rootDir) : [];
  
  const allIssues = [...archIssues, ...securityIssues];

  // Filter issues to only include changed files
  // arch/security checkers use relative paths from rootDir
  const filteredIssues = allIssues.filter(issue => {
      // Changed files paths are usually relative to git root.
      // Assuming rootDir is git root.
      return changedFiles.includes(issue.file);
  });

  return {
     files: changedFiles.length,
     issues: filteredIssues
  };
}
