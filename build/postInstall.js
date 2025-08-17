const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');
const { execSync } = require('child_process');
const tar = require('tar');
const AdmZip = require('adm-zip');

const logDir = path.join(os.homedir(), 'Library', 'Logs', 'PatientManagement');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'installer.log');

function log(msg) {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
}

// -------------------------------
// MongoDB version & download URL
// -------------------------------
function getMongoVersion() {
  const pkg = require('../package.json');
  const version = pkg.dependencies.mongodb.replace(/^[^0-9]*/, '');
  log("Mongo version required: " + version);
  return version;
}

function getMongoDownloadUrl(version) {
  const platform = process.platform;
  const arch = os.arch();
  log(`OS: ${platform} | Arch: ${arch}`);

  if (platform === 'win32') {
    if (arch === 'x64') return `https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-${version}-signed.msi`;
    throw new Error(`Unsupported architecture ${arch} on Windows`);
  } else if (platform === 'darwin') {
    if (arch === 'x64') return `https://fastdl.mongodb.org/osx/mongodb-macos-x86_64-${version}.tgz`;
    if (arch === 'arm64') return `https://fastdl.mongodb.org/osx/mongodb-macos-arm64-${version}.tgz`;
    throw new Error(`Unsupported architecture ${arch} on macOS`);
  } else if (platform === 'linux') {
    if (arch === 'x64') return `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-${version}.tgz`;
    if (arch === 'arm64') return `https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-${version}.tgz`;
    throw new Error(`Unsupported architecture ${arch} on Linux`);
  }
  throw new Error(`Unsupported platform: ${platform}`);
}

// -------------------------------
// Download & extract
// -------------------------------
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    log(`Downloading MongoDB from ${url}`);
    const file = fs.createWriteStream(dest);

    https.get(url, response => {
      if (response.statusCode !== 200) {
        const errMsg = `Download failed: Status Code ${response.statusCode}`;
        log(errMsg);
        return reject(new Error(errMsg));
      }
      response.pipe(file);
      file.on('finish', () => file.close(() => {
        log(`Download completed: ${dest}`);
        resolve(dest);
      }));
    }).on('error', err => {
      log(`Download error: ${err.message}`);
      reject(err);
    });
  });
}

function extractAndInstall(filePath, installDir) {
  const platform = process.platform;
  const ext = path.extname(filePath).toLowerCase();
  log(`Extracting MongoDB from ${filePath} to ${installDir}`);

  try {
    if (platform === 'win32' && ext === '.msi') {
      execSync(`msiexec /i "${filePath}" /quiet INSTALLLOCATION="${installDir}"`);
      log('MongoDB MSI installed.');
    } else if (ext === '.tgz' || ext === '.tar.gz') {
      tar.x({ file: filePath, cwd: installDir, strip: 1 });
      log('MongoDB tar.gz extracted.');
    } else if (ext === '.zip') {
      const zip = new AdmZip(filePath);
      zip.extractAllTo(installDir, true);
      log('MongoDB zip extracted.');
    } else {
      throw new Error(`Unsupported archive format: ${ext}`);
    }
  } catch (err) {
    log(`Extraction failed: ${err.message}`);
    throw err;
  }
}

// -------------------------------
// Detect system-installed MongoDB
// -------------------------------
function isMongoInstalled() {
  const cmds = ['mongo', 'mongosh', 'mongod'];
  return cmds.some(cmd => {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  });
}

function getSystemMongoBinPath() {
  const paths = ['/usr/local/bin', '/usr/bin', '/opt/homebrew/bin'];
  for (const p of paths) {
    if (fs.existsSync(path.join(p, process.platform === 'win32' ? 'mongod.exe' : 'mongod'))) {
      return p;
    }
  }
  return null;
}

// -------------------------------
// Setup app
// -------------------------------
async function setupApp(installDir) {
  if (!fs.existsSync(installDir)) fs.mkdirSync(installDir, { recursive: true });

  let mongoBinPath = path.join(installDir, 'mongodb', 'bin');
  if (!isMongoInstalled()) {
    log('MongoDB not found. Installing...');
    const version = getMongoVersion();
    const url = getMongoDownloadUrl(version);
    const mongoDir = path.join(installDir, 'mongodb');
    fs.mkdirSync(mongoDir, { recursive: true });
    const tempFile = path.join(os.tmpdir(), path.basename(url));
    await downloadFile(url, tempFile);
    extractAndInstall(tempFile, mongoDir);
  } else {
    log('MongoDB already installed system-wide.');
    const sysPath = getSystemMongoBinPath();
    if (sysPath) mongoBinPath = sysPath;
  }

  // Setup app folders & config.json
  const repoPath = path.join(installDir, 'appData', 'repository');
  // Application logs folder
  const appLogsPath = path.join(installDir, 'appData', 'applicationLogs');
  fs.mkdirSync(appLogsPath, { recursive: true });
  fs.mkdirSync(path.join(repoPath, 'data'), { recursive: true });
  fs.mkdirSync(path.join(repoPath, 'logs'), { recursive: true });

  const configPath = path.join(installDir, 'config.json');
  const config = {
    workspacePath: repoPath,
    mongoDataPath: path.join(repoPath, 'data'),
    mongoLogPath: path.join(repoPath, 'logs', 'mongo.log'),
    appLogsPath: appLogsPath,
    mongoBinPath,
    mongoPort: 27017
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  log('Post-install setup completed successfully.');
  return config;
}

module.exports = { setupApp, log };