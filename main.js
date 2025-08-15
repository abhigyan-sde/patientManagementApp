const { app, Menu, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

let mongoProcess;
let config;

// Auto-detect environment
const isDev = !app.isPackaged;
process.env.NODE_ENV = isDev ? 'development' : 'production';
console.log(`🚀 Running in ${process.env.NODE_ENV} mode`);

// -------------------------------
// Wait for Angular server (Dev only)
// -------------------------------
function waitForAngularServer(url, interval = 1000, retries = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      http.get(url, res => (res.statusCode === 200 ? resolve() : retry()))
        .on('error', retry);
    };

    const retry = () => {
      if (++attempts >= retries) reject(new Error('Angular server did not start in time.'));
      else setTimeout(check, interval);
    };

    check();
  });
}

// -------------------------------
// Start/Stop MongoDB (Prod only)
// -------------------------------
function startMongo() {
  if (!config?.mongoBinPath) return;

  const mongoPath = path.join(
    config.mongoBinPath,
    process.platform === 'win32' ? 'mongod.exe' : 'mongod'
  );

  const args = [
    '--dbpath', config.mongoDataPath,
    '--logpath', config.mongoLogPath
  ];

  try {
    mongoProcess = spawn(mongoPath, args, { stdio: 'inherit' });
    console.log(`✅ MongoDB started from ${mongoPath}`);
  } catch (err) {
    console.error('❌ Failed to start MongoDB:', err);
    dialog.showErrorBox('MongoDB Error', `Failed to start MongoDB: ${err.message}`);
  }
}

async function stopMongo() {
  if (mongoProcess) {
    mongoProcess.kill();
    console.log('🛑 MongoDB stopped.');
  }
}

// -------------------------------
// Create BrowserWindow
// -------------------------------
async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preLoadScripts', 'preload.js')
    }
  });

  try {
    if (isDev) {
      // Dev mode: Angular dev server
      await waitForAngularServer('http://localhost:4200');
      win.loadURL('http://localhost:4200');
      win.webContents.openDevTools();
    } else {
      // Production / packaged mode
      const possiblePaths = [
        // 1️⃣ Packaged inside ASAR (electron-builder adds 'browser' folder)
        path.join(__dirname, 'angular-ui-build', 'browser', 'index.html'),
        // 2️⃣ Unpacked in resources (electron-builder extraResources)
        path.join(process.resourcesPath, 'angular-ui-build', 'browser', 'index.html'),
        // 3️⃣ Local build (if running directly without packaging)
        path.join(__dirname, 'angular-ui-build', 'index.html'),
        path.join(process.resourcesPath, 'angular-ui-build', 'index.html')
      ];

      const indexPath = possiblePaths.find(fs.existsSync);

      if (!indexPath) {
        console.error('❌ Angular dist folder not found!');
        console.error('📂 Checked paths:', possiblePaths.join('\n📂 '));
        throw new Error('Angular build not found at expected paths');
      }

      win.loadFile(indexPath);
    }
  } catch (err) {
    console.error('❌ Failed to load Angular:', err);
    dialog.showErrorBox('Angular Error', `Failed to load Angular: ${err.message}`);
  }

  // Setup menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Dark Mode',
          type: 'checkbox',
          checked: false,
          click: (menuItem) => win.webContents.send('toggle-dark-mode', menuItem.checked)
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}


// -------------------------------
// App Ready
// -------------------------------
app.whenReady().then(async () => {
  try {
    if (isDev) {
      // Dev: Connect to local MongoDB via service
      const mongoService = require('./repository/mongoService');
      await mongoService.connectToMongoDB();
    } else {
      // Prod: Setup paths and start embedded Mongo
      if (process.platform === 'darwin' || process.platform === 'linux') {
        const { setupApp, log } = require(path.join(__dirname, 'build', 'postInstall'));
        const installDir = app.getPath('userData');
        log(`Running setupApp in ${installDir}`);
        config = await setupApp(installDir);
      } else {
        const configPath = path.join(app.getPath('userData'), 'config.json');
        if (!fs.existsSync(configPath)) throw new Error('config.json not found.');
        config = JSON.parse(fs.readFileSync(configPath));
      }
      console.log('📂 Config loaded:', config);
      startMongo();
    }

    // Handlers (both dev and prod)
    require('./handlers/patientHandler')();
    require('./handlers/fileHandler')();
    require('./handlers/appointmentHandler')();

    await createWindow();
  } catch (err) {
    console.error('❌ Failed to start app:', err);
    dialog.showErrorBox('Startup Error', `Failed to start app: ${err.message}`);
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (!isDev) await stopMongo();
});
