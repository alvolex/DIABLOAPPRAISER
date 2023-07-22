/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, desktopCapturer } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

// import { getWindowPositionByName } from '../CustomAddons/GetWindowPosition';
// import { getWindowPositionByName } from 'CustomAddons/GetWindowPosition.node'; // ! UNCOMMENT THIS FOR BUILD TO WORK
import { getWindowPositionByName } from 'get-window-position'; // use the two above if you don't have access to the native module
import screenshot from 'screenshot-desktop';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

/* IPCS */
ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));

  mainWindow?.webContents.send(
    'ipc-example',
    msgTemplate('Tesseract from main')
  );
});

ipcMain.on('run-tesseract', async (event, arg) => {
  mainWindow?.webContents.send('tesseract', arg);
});

ipcMain.on('take-screenshot', async (event, arg, cords) => {
  //mainWindow?.webContents.send('take-screenshot', arg);
  //Screenshot and save to ../screenshots
  screenshot({ filename: path.join(__dirname, `../screenshots/row-${cords.row} col-${cords.col}.png`) }).then((img) => {
    console.log(img);
  });
});

/* Initialization */
if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    autoHideMenuBar: true,
    frame: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


//Handle overlay positioning
type Pos = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const positionOverlay = () => {
  let lastPos: Pos = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  };

  setInterval(() => {
    const windowPos = getWindowPositionByName('Spotify Premium');
    if (!windowPos) {
      mainWindow?.hide();
      return;
    }

    if (
      lastPos.left === windowPos.left &&
      lastPos.top === windowPos.top &&
      lastPos.right === windowPos.right &&
      lastPos.bottom === windowPos.bottom
    ) {
      return;
    }

    lastPos = windowPos;
    mainWindow?.show();

    const windowHeight = windowPos.bottom - windowPos.top;
    const windowWidth = windowPos.right - windowPos.left;

    mainWindow?.setPosition(windowPos.left, windowPos.top);
    mainWindow?.setSize(windowWidth, windowHeight);

    // these should be set in the constructor
    //mainWindow?.setOpacity(0.5);
    mainWindow?.setAlwaysOnTop(true, 'floating');
    //mainWindow?.setIgnoreMouseEvents(true, { forward: true });
  }, 10);
};


// Create main BrowserWindow when electron is ready
app
  .whenReady()
  .then(() => {
    createWindow();
    positionOverlay();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
