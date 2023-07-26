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

import { getWindowPositionByName } from 'get-window-position'; 
import screenshot from 'screenshot-desktop';
import sharp from 'sharp';
import fs from 'fs';
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

type Pos = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

//Used for overlay positioning and cropping screenshots
let lastPos: Pos = {
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

/* IPCS */
ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));

  mainWindow?.webContents.send(
    'ipc-example',
    msgTemplate('Tesseract from main')
  );
});

let inEditMode = false;
ipcMain.on('toggle-clickthrough', async (event, arg, isHovering) => {
  let buttonClicked = isHovering === null;

  if (inEditMode && !buttonClicked) {
    return;
  }

  if (buttonClicked) {
    mainWindow?.setIgnoreMouseEvents(inEditMode, { forward: inEditMode });
    inEditMode = !inEditMode;
    return;
  }

  mainWindow?.setIgnoreMouseEvents(isHovering, { forward: isHovering });
});

//get the screenshot from the screenshot folder and send it to the renderer
ipcMain.on('run-tesseract', async (event, arg, imageName) => {
  let screenShotsPath = app.isPackaged ? path.join(process.resourcesPath, 'assets/screenshots/') : path.join(__dirname, '../../assets/screenshots/');

  const image = fs.readFileSync(screenShotsPath + imageName);
  event.reply('tesseract', image);
});

ipcMain.on('take-screenshot', async (event, arg, cords, mousePos, name) => {
  if (inEditMode) {
    return;
  }

  //Hack so that the clickthrough (ignoreMouseEvents) works correctly with hover effects and doesnt trigger multiple onMouseEnter events
  setTimeout(() => {
    mainWindow?.setIgnoreMouseEvents(false, { forward: true });
  }, 100);
  setTimeout(() => {
    mainWindow?.setIgnoreMouseEvents(true, { forward: true });
  }, 150);

  let screenShotsPath = app.isPackaged ? path.join(process.resourcesPath, 'assets/screenshots/') : path.join(__dirname, '../../assets/screenshots/');
  const filePath = { filename: screenShotsPath + `/${name} tmp-row-${cords.row} col-${cords.col}.png`};
  const filePathCropped = screenShotsPath + `/${name} row-${cords.row} col-${cords.col}.png`;

  //Size and bounds for cropping the screenshot
  let width = 1200;
  let height = 1400;
  let top = lastPos.top + mousePos.y - height / 2;
  let left = lastPos.left + mousePos.x - width / 2;
  if(top + height > lastPos.bottom) {
    top = lastPos.bottom - height;
  }
  top = top < 0 ? 0 : top;
  if(left + width > lastPos.right) {
    left = lastPos.right - width;
  }
  left = left < 0 ? 0 : left;

  //Small timeout so weapon gets shown
  setTimeout(() => {
    screenshot(filePath).then((img) => {
    sharp(img)
      .extract({
        left: left,
        top: top,
        width,
        height,
      })
      .grayscale()
      .toFile(filePathCropped)
      .then(() => {
        fs.unlink(filePath.filename, (err) => {
          if (err) {
            console.error(err);
            return;
          }
        });
      });
  });
  }, 100);
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
    transparent: true,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      devTools: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow?.setAlwaysOnTop(true, 'floating');
  mainWindow?.setIgnoreMouseEvents(true, { forward: true });

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

process.on('exit', () => {
  app.quit();
});

//Handle overlay positioning
const positionOverlay = () => {
  setInterval(() => {
    const windowPos = getWindowPositionByName('Untitled - Notepad');
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
  }, 1000);
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
