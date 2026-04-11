import fs from 'fs-extra';
import path from 'path';

const CONFIG_FILE = '.mad-pro.json';

export function getConfigPath(rootDir = process.cwd()) {
  return path.join(rootDir, CONFIG_FILE);
}

export function loadConfig(rootDir = process.cwd()) {
  const configPath = getConfigPath(rootDir);
  if (fs.existsSync(configPath)) {
    try {
      return fs.readJsonSync(configPath);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function saveConfig(config, rootDir = process.cwd()) {
  const configPath = getConfigPath(rootDir);
  fs.writeJsonSync(configPath, config, { spaces: 2 });
}

export function updateConfig(updates, rootDir = process.cwd()) {
  const currentConfig = loadConfig(rootDir) || {};
  const newConfig = { ...currentConfig, ...updates };
  saveConfig(newConfig, rootDir);
  return newConfig;
}
