'use strict';

const { app, BrowserWindow, screen } = require('electron');
const { startControlServer } = require('./src/control-server');
const settings = require('./src/settings');
const scheduler = require('./src/scheduler');

let mainWindow = null;

function getMainWindow() {
  return mainWindow;
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    fullscreen: true,
    kiosk: true,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: false,
    },
  });

  const config = settings.get();
  mainWindow.loadURL(config.displayUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  startControlServer(getMainWindow);
  scheduler.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
