'use strict'

import {app, protocol, BrowserWindow, Tray, Menu, ipcMain, shell} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import path from 'path';
import GameDataHelper from './helpers/GameDataHelper';
import AppDataHelper from './helpers/appDataHelper';
import AgentRegistry from './agentRegistry';
import CrowdControlAgent from './agents/crowdControlAgent';
import VtubeStudioAgent from './agents/vtubeStudioAgent';
import OverlayAgent from './agents/overlayAgent';
const isDevelopment = process.env.NODE_ENV !== 'production'
const { autoUpdater } = require('electron-updater');

const userDataPath = app.getPath('userData');
const uuid = require('uuid');

let overlayRoot = (app.isPackaged ? '../' : '')+'../public/overlay';
let overlayPath = path.resolve(__static, overlayRoot+'/overlay.html');
console.log('BIP', overlayPath);
// Loading core data file
let appData = new AppDataHelper(userDataPath);
appData.loadData();
appData.update('overlayPath', overlayPath);

let gameData = new GameDataHelper(userDataPath,__static);

//load connections
let agentRegistry = new AgentRegistry(appData,gameData);
let agents = [
    new CrowdControlAgent,
    new VtubeStudioAgent,
    new OverlayAgent,
];

gameData.setAgentRegistry(agentRegistry);

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
]);

let mainWindow;
let authWindow;

async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    icon: path.resolve(__static, 'icon.ico'),
    title: "'TuberYeets v" + app.getVersion(),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#FDD353',
      symbolColor: '#1A172A',
      height: 74
    },
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.resolve(__static, 'preload.js'),
      webSecurity: false
    },

    autoHideMenuBar: true,
    useContentSize: true
  });

  agentRegistry.getAgent('crowdcontrol').onGamePackLoad = () => {
    let agent = agentRegistry.getAgent('crowdcontrol');
    let payload = {};
    try {
      payload = {
        gameId: agent.currentPack.game.gameID,
        packId: agent.currentPack.gamePackID,
        packs: agent.currentGame
      };
    } catch(e) {
      console.log("Game Pack not yet loaded! will try again in 0.5s");
      setTimeout(() => {agent.onGamePackLoad()},500);
      return;
    }
    mainWindow.webContents.send('GET_GAME', payload);
  }

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools({mode:"detach"});
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    mainWindow.loadURL('app://./index.html')
    autoUpdater.checkForUpdatesAndNotify();
  }

  mainWindow.on("minimize", () => {
    if (appData.read('minimizeToTray'))
    {
      setTray();
      mainWindow.setSkipTaskbar(true);
    }
    else
    {
      if (tray != null)
      {
        setTimeout(() => {
          tray.destroy()
        }, 100);
      }

      mainWindow.setSkipTaskbar(false);
    }
  });

  mainWindow.on("restore", () => {
    if (tray != null)
    {
      setTimeout(() => {
        tray.destroy()
      }, 100);
    }

    mainWindow.setSkipTaskbar(false);
  });

  mainWindow.on("close", () => {
    exiting = true;
  });
}

async function createAuthWindow(connectionId) {
  let authUrl = `https://auth.crowdcontrol.live/?connectionID=${encodeURIComponent(connectionId)}`;
  await shell.openExternal(authUrl);
}

function setTray()
{
  tray = new Tray(__dirname + "/icon.ico");
  contextMenu = Menu.buildFromTemplate([
    { label: "Open", click: () => { mainWindow.restore(); } },
    { label: "Quit", role: "quit" }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on("click", () => { mainWindow.restore(); });
}

let tray = null, contextMenu;

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  agents.forEach((agent) => {
    agentRegistry.registerAgent(agent);
  });

  createWindow();
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (messageData) => {
      if (messageData === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}


autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('UPDATE_AVAILABLE');
  console.log('Update is available!');
});
autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('UPDATE_DOWNLOADED');
});


// Periodically reporting status back to renderer
let exiting = false;
setInterval(() => {
  let ccStatus = agentRegistry.getAgentStatus('crowdcontrol');
  let vtsStatus = agentRegistry.getAgentStatus('vtubestudio');
  let overlayStatus = agentRegistry.getAgentStatus('overlay');
  let calibrateStage = agentRegistry.getAgent('overlay').getCalibrateStage();
  if (mainWindow != null)
  {
    let status = 0;
    if (ccStatus !== 'connected')
      status = 1;
    else if (vtsStatus !== 'connected' && vtsStatus !== 'disabled')
      status = 8;
    else if (overlayStatus !== 'waiting-for-vts' && overlayStatus !== 'connected' && overlayStatus !== 'disabled')
      status = 2;
    else if (calibrateStage === 0 || calibrateStage === 1)
      status = 3;
    else if (calibrateStage === 2 || calibrateStage === 3)
      status = 4;
    else if (overlayStatus == 'waiting-for-vts')
      status = 5;
    else if (calibrateStage === -1)
      status = 7;
    if (!exiting) {
      mainWindow.webContents.send("STATUS", status);
    }

  }
}, 500);

setInterval(() => {
  if (mainWindow != null && !exiting)
  {
      mainWindow.webContents.send("AGENT_STATUS", agentRegistry.getAllAgentStatus());
      mainWindow.webContents.send("CALIBRATE_STATUS", agentRegistry.getAgent('overlay').getCalibrateStage());
  }
}, 500);

// ----------------
// Data Management
// ----------------

appData.statusCallback = function(status) {
  if (mainWindow != null && !exiting) {
    mainWindow.webContents.send("SAVE_STATUS", status);
  }
}
gameData.statusCallback = function(status) {
  if (mainWindow != null && !exiting) {
    mainWindow.webContents.send("GAME_SAVE_STATUS", status);
  }
}
gameData.itemGroupDefaultsCallback = function() {
  return {
    groupFrequency: appData.read('groupFrequency'),
    throwDuration: appData.read('throwDuration'),
    throwAngleMin: appData.read('throwAngleMin'),
    throwAngleMax: appData.read('throwAngleMax'),
    spinSpeedMin: appData.read('spinSpeedMin'),
    spinSpeedMax: appData.read('spinSpeedMax'),
  }
}

ipcMain.on('GET_DATA_PATH', (event, payload) => {
  event.reply('GET_DATA_PATH', userDataPath);
});

ipcMain.on('LOAD_DATA', (event, payload) => {
  try {
    appData.loadData();
    appData.update('overlayPath', overlayPath);
  } catch {}
  event.reply('LOAD_DATA', appData.getAllData());
});

ipcMain.on('BEGIN_CC_AUTH', async(event) => {
  await createAuthWindow(agentRegistry.getAgent('crowdcontrol').connectionId);
});

ipcMain.on('SET_GAME', (event, payload) => {
  let gameId = payload.gameId;
  let packId = payload.packId;
  let agent = agentRegistry.getAgent('crowdcontrol');
  agent.loadGameMenu(gameId, packId);
});

ipcMain.on('GET_GAME', (event, payload) => {
  agentRegistry.getAgent('crowdcontrol').onGamePackLoad();
});


ipcMain.on('SAVE_GAME_DATA', (event, payload) => {
  let save_data = payload.data;
  event.reply('SAVE_GAME_DATA', save_success);
});

ipcMain.on("SET_FIELD", (event, payload) =>
{
  try {
    appData.update(payload.field, payload.value, payload.create);
  } catch {}
});


ipcMain.handle('APP_CRUD', async (event, operation, payload) => {
  switch(operation) {
    case "read":
      return appData.read(payload.field);
      break;
    case "update":
      return appData.update(payload.field, payload.value, payload.create);
      break;
    case "delete":
      return appData.delete(payload.field);
      break;
  }
});

ipcMain.handle('GAME_CRUD', async (event, operation, payload) => {
  switch(operation) {
    case "read":
      return gameData.read(payload.field);
      break;
    case "update":
      return gameData.update(payload.field, payload.value, payload.create);
      break;
    case "delete":
      return gameData.delete(payload.field);
      break;
  }
});

ipcMain.on('APP_CRUD_SYNC', async (event, operation, payload) => {
  switch(operation) {
    case "read":
      event.returnValue = appData.read(payload.field);
      break;
    case "update":
      event.returnValue = appData.update(payload.field, payload.value, payload.create);
      break;
    case "delete":
      event.returnValue = appData.delete(payload.field);
      break;
  }
});

ipcMain.on('GAME_CRUD_SYNC', async (event, operation, payload) => {
  switch(operation) {
    case "read":
      event.returnValue = gameData.read(payload.field);
      break;
    case "update":
      event.returnValue = gameData.update(payload.field, payload.value, payload.create);
      break;
    case "delete":
      event.returnValue = gameData.delete(payload.field);
      break;
  }
});

ipcMain.on("SET_GAME_FIELD", (event, payload) =>
{
  try {
    gameData.update(payload.field, payload.value, payload.create);
  } catch {}
});

ipcMain.handle('UPLOAD_ITEM', async (event, payload) => {
  return gameData.uploadItem(payload.filePath,payload.filename);
});

ipcMain.handle('UPLOAD_SOUND', async (event, payload) => {
  return gameData.uploadSound(payload.filePath,payload.filename);
});

ipcMain.handle('UPLOAD_DECAL', async (event, payload) => {
  return gameData.uploadDecal(payload.filePath,payload.filename,payload.itemGroupId);
});

ipcMain.handle('UPLOAD_WINDUP', async (event, payload) => {
  return gameData.uploadWindup(payload.filePath,payload.filename,payload.itemGroupId);
});

ipcMain.handle('CREATE_ITEM_GROUP', async (event) => {
  return gameData.createItemGroup();
});
ipcMain.handle('CLEAR_ITEM_GROUP', async (event, payload) => {
  return gameData.clearItemGroup(payload.itemGroupId);
});
ipcMain.handle('CREATE_TRIGGER', async (event, payload) => {
  let newEvent = gameData.eventData.createTrigger(payload.agentKey, payload.eventKey);
  return {success:true, item:newEvent}
});
ipcMain.handle('GET_EVENT_TYPES', async (event) => {
  return agentRegistry.getAvailableEvents();
});
ipcMain.handle('GET_EVENT_SETTINGS', async (event,payload) => {
  return await agentRegistry.getEventSettings(payload.agentKey, payload.eventKey);
});

ipcMain.handle('CREATE_COMMAND', async (event, payload) => {
  let newCommand = gameData.eventData.createTriggerCommand(payload.triggerId, payload.scriptName, payload.agentKey, payload.actionKey);
  return {success:true, item:newCommand}
});
ipcMain.handle('GET_ACTION_TYPES', async (event) => {
  return agentRegistry.getAvailableActions();
});
ipcMain.handle('GET_ACTION_SETTINGS', async (event,payload) => {
  return await agentRegistry.getActionSettings(payload.agentKey, payload.actionKey);
});
ipcMain.handle('GET_COMMAND_DETAILS', async (event,payload) => {
  return await agentRegistry.getCommandDetails(payload.agentKey, payload.actionKey, payload.values);
});

ipcMain.handle('GET_TRIGGER_DETAILS', async (event,payload) => {
  return await agentRegistry.getTriggerDetails(payload.agentKey, payload.triggerKey, payload.values);
});

ipcMain.handle('GET_AGENT_DETAILS', async (event) => {
  return agentRegistry.getAllAgentDetails();
});

ipcMain.handle('GET_OVERLAY_PATH', async (event) => {
  return 'file://'+overlayPath+'?port='+agentRegistry.getAgentFieldData(agentRegistry.getAgent('overlay'),'port');
});

ipcMain.handle('GET_AGENT_SETTINGS', async (event, payload) => {
  return agentRegistry.getAgentSettings(payload.agentKey);
});

ipcMain.handle('ENABLE_AGENT', async (event, payload) => {
  return agentRegistry.activateAgent(payload.agentKey);
});

ipcMain.handle('DISABLE_AGENT', async (event, payload) => {
  return agentRegistry.deactivateAgent(payload.agentKey);
});

ipcMain.handle('RESTART_AGENT', async (event, payload) => {
  return agentRegistry.reloadAgent(payload.agentKey);
});

ipcMain.on('OPEN_GAME_FOLDER', async (event, payload) => {
  await shell.openPath(gameData.gameDataFolder);
});

ipcMain.on('CHECK_UPDATE', async () => {
  await autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.on('RESTART', () => {
  autoUpdater.quitAndInstall();
});

// -----------------
// Model Calibration
// -----------------

ipcMain.on("CALIBRATE_START", () => startCalibrate());
ipcMain.on("CALIBRATE_NEXT", () => nextCalibrate());
ipcMain.on("CALIBRATE_CANCEL", () => cancelCalibrate());

function startCalibrate()
{
  if(agentRegistry.getAgentStatus('vtubestudio') == 'connected' && agentRegistry.getAgentStatus('overlay') == 'connected') {
    return agentRegistry.getAgent('overlay').startCalibration();
  }

}

function nextCalibrate()
{
  if(agentRegistry.getAgentStatus('vtubestudio') == 'connected' && agentRegistry.getAgentStatus('overlay') == 'connected') {
    return agentRegistry.getAgent('overlay').nextCalibration();
  }
}

function cancelCalibrate()
{
  if(agentRegistry.getAgentStatus('vtubestudio') == 'connected' && agentRegistry.getAgentStatus('overlay') == 'connected') {
    return agentRegistry.getAgent('overlay').cancelCalibration();
  }
}

// -----
// Item Throws
// -----

// Testing a specific item
ipcMain.on("TEST_CUSTOM_ITEM", (event, message) => testItem(event, message));
ipcMain.on("TEST_ITEM_GROUP", (_, message) => { console.log('testing item group ' + message); custom(message); });

function testItem(_, item)
{
  if(agentRegistry.getAgentStatus('overlay') == 'connected') {
    return agentRegistry.eventManager.handleOutputAction('overlay','throwItem',{item: item, quantity: 1});
  }
}

// A custom item group test
function custom(customName,customCount=null)
{
  if(agentRegistry.getAgentStatus('overlay') == 'connected') {
    return agentRegistry.eventManager.handleOutputAction('overlay','throwItemGroup',{itemGroup: customName});
  }
}


