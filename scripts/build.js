#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const reactBuildDir = path.join(rootDir, 'build');
const pluginSlug = 'flydb';
const packageDir = path.join(distDir, pluginSlug);

const ROOT_DIR_EXCLUDES = new Set([
  '.git',
  '.github',
  '.idea',
  '.vscode',
  '.wordpress-org',
  'temp',
  'dev-resources',
  'node_modules',
  'assets',
  'dist',
]);

const FILE_EXCLUDES = new Set([
  '.DS_Store',
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.gitignore',
  '.babelrc',
  'admin-old.scss',
  'plan.md',
  'BUILD.md',
  'current-task-outline.md'
]);

const DEV_FILE_REMOVALS = [
  'package.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'scripts',
  'README.md',
  'REACT-REFACTOR.md',
  'src',
  'node_modules',
];

const log = (message) => console.log(`\n▶ ${message}`);

const run = (command, options = {}) => {
  log(`$ ${command}`);
  execSync(command, {
    cwd: rootDir,
    stdio: 'inherit',
    ...options,
  });
};

const ensureFreshBuildDir = async () => {
  await fs.promises.rm(distDir, { recursive: true, force: true });
  await fs.promises.mkdir(packageDir, { recursive: true });
};

const getPluginVersion = async () => {
  const pluginFile = path.join(rootDir, 'flydb.php');
  const contents = await fs.promises.readFile(pluginFile, 'utf8');
  const match = contents.match(/\*\s*Version:\s*([0-9.]+)/i);

  if (!match) {
    throw new Error('Unable to detect Version in flydb.php');
  }

  return match[1];
};

const shouldIgnore = (relativePath, stats) => {
  if (!relativePath) {
    return false;
  }

  const normalized = relativePath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  const rootSegment = segments[0];
  const fileName = segments[segments.length - 1];

  if (ROOT_DIR_EXCLUDES.has(rootSegment)) {
    return true;
  }

  if (!stats.isDirectory() && FILE_EXCLUDES.has(fileName)) {
    return true;
  }

  return false;
};

const copyDirectory = async (source, destination, relativePrefix = '') => {
  const entries = await fs.promises.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const entryRelativePath = relativePrefix
      ? `${relativePrefix}/${entry.name}`
      : entry.name;
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    
    let stats;
    try {
      stats = await fs.promises.lstat(sourcePath);
    } catch (error) {
      // Skip files that no longer exist (broken symlinks, etc.)
      if (error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }

    if (shouldIgnore(entryRelativePath, stats)) {
      continue;
    }

    if (stats.isDirectory()) {
      await fs.promises.mkdir(destinationPath, { recursive: true });
      await copyDirectory(sourcePath, destinationPath, entryRelativePath);
    } else if (stats.isSymbolicLink()) {
      try {
        const linkTarget = await fs.promises.readlink(sourcePath);
        await fs.promises.symlink(linkTarget, destinationPath);
      } catch (error) {
        // Skip broken symlinks
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    } else {
      try {
        await fs.promises.copyFile(sourcePath, destinationPath);
      } catch (error) {
        // Skip files that can't be copied
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
  }
};

const removeDevArtifacts = async () => {
  for (const relative of DEV_FILE_REMOVALS) {
    await fs.promises.rm(path.join(packageDir, relative), { recursive: true, force: true });
  }
};

const ensureReactBuildExists = async () => {
  const buildPath = path.join(reactBuildDir, 'index.js');
  try {
    await fs.promises.access(buildPath, fs.constants.R_OK);
  } catch {
    throw new Error('React build assets not found. Run npm run build first.');
  }
};

const copyReactBuildAssets = async () => {
  const sourceBuildDir = reactBuildDir;
  const destBuildDir = path.join(packageDir, 'build');
  
  await fs.promises.mkdir(destBuildDir, { recursive: true });
  await copyDirectory(sourceBuildDir, destBuildDir);
};

const createZipArchive = async (zipFileName) => {
  const zipTarget = path.join(distDir, zipFileName);
  await fs.promises.rm(zipTarget, { force: true });

  try {
    execSync(`zip -r ${zipFileName} ${pluginSlug}`, {
      cwd: distDir,
      stdio: 'inherit',
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('\n⚠️  `zip` command not found – skipping archive generation.');
    } else {
      throw error;
    }
  }
};

(async () => {
  try {
    const version = await getPluginVersion();
    const zipName = `${pluginSlug}-${version}.zip`;

    console.log(`🧱  Building FlyDB plugin (v${version})`);
    
    log('Building React assets');
    run('npm run build');
    await ensureReactBuildExists();
    
    await ensureFreshBuildDir();

    log('Copying plugin files into dist/flydb');
    await copyDirectory(rootDir, packageDir);
    
    log('Copying React build assets');
    await copyReactBuildAssets();

    log('Removing developer-only artifacts');
    await removeDevArtifacts();

    log(`Creating distributable zip (${zipName})`);
    await createZipArchive(zipName);

    console.log(`
✅  Build finished. Artifacts located in ${distDir}
📦  Zip file: ${zipName}`);
  } catch (error) {
    console.error('\n❌  Build failed:', error.message);
    process.exitCode = 1;
  }
})();
