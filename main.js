const { app, Menu, BrowserWindow } = require('electron');
const path = require('path');
const mongoService = require('./repository/mongoService');
const http = require('http');

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preLoadScripts', 'preload.js'),
    }
  });

  // Wait a few seconds before loading Angular
  try {
    await waitForAngularServer('http://localhost:4200');
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();
  } catch (err) {
    console.error('Failed to load Angular : ', err);
  }

  const menu = Menu.buildFromTemplate([
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Dark Mode',
          type: 'checkbox',
          checked: false, // default to light mode
          click: (menuItem) => {
            // Send message to renderer to toggle dark mode
            win.webContents.send('toggle-dark-mode', menuItem.checked);
          }
        }
      ]
    },
    // other menus here...
  ]);

   Menu.setApplicationMenu(menu);
}


app.whenReady().then(async () => {
  try {
    // ✅ 1. Connect to MongoDB before anything else
    await mongoService.connectToMongoDB();

    // ✅ 2. Only now require the handlers (after DB is connected)
    const setUpPatientHandlers = require('./handlers/patientHandler');
    const setUpFileHandlers = require('./handlers/fileHandler');
    const setUpAppointmentHandlers = require('./handlers/appointmentHandler');

    // ✅ 3. Set up handlers
    setUpPatientHandlers();
    setUpFileHandlers();
    setUpAppointmentHandlers();

    // ✅ 4. Launch UI
    createWindow();

  } catch (err) {
    console.error('Failed to start app:', err);
    app.quit();
  }
});


app.on('before-quit', async () => {
  await mongoService.closeMongoDB();
});


function waitForAngularServer(url, interval = 1000, retries = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      http.get(url, res => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      }).on('error', retry);
    };

    const retry = () => {
      if (++attempts >= retries) {
        reject(new Error('Angular server did not start in time.'));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
}