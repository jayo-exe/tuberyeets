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

let bonkRoot = (app.isPackaged ? '../' : '')+'../public/bonker';
let bonkerPath = path.resolve(__static, bonkRoot+'/bonker.html');

// Loading core data file
let appData = new AppDataHelper(userDataPath);
appData.loadData();
appData.update('bonkerPath', bonkerPath);

let gameData = new GameDataHelper(userDataPath,__static);

//load connections
let agentRegistry = new AgentRegistry(appData,gameData);
let agents = [
    new CrowdControlAgent,
    new VtubeStudioAgent,
    new OverlayAgent
];

gameData.setAgentRegistry(agentRegistry);


// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
]);

let mainWindow;

async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    minWidth: 1200,
    minHeight: 720,
    icon: path.resolve(__static, 'icon.ico'),
    title: "'TuberYeets v" + app.getVersion(),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#4746b8',
      symbolColor: '#74b1be',
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
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools({mode:"bottom"});
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
  }
}, 500);

// ----------------
// Data Management
// ----------------

appData.statusCallback = function(status) {
  mainWindow.webContents.send("SAVE_STATUS", status);
}
gameData.statusCallback = function(status) {
  mainWindow.webContents.send("GAME_SAVE_STATUS", status);
}
gameData.bonkDefaultsCallback = function() {
  return {
    barrageFrequency: appData.read('barrageFrequency'),
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
  console.log('got load request');
  try {
    appData.loadData();
    appData.update('bonkerPath', bonkerPath);
  } catch {}
  event.reply('LOAD_DATA', appData.getAllData());
});

ipcMain.on('SET_GAME', (event, payload) => {
  console.log('GOT SET GAME REQUEST');
  let gameId = payload;
  agentRegistry.getAgent('crowdcontrol').setGame(gameId);
  event.reply('SET_GAME', gameId);
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
  console.log(payload);
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
  console.log(payload);
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

ipcMain.handle('UPLOAD_THROW', async (event, payload) => {
  return gameData.uploadThrow(payload.filePath,payload.filename);
});

ipcMain.handle('UPLOAD_IMPACT', async (event, payload) => {
  return gameData.uploadImpact(payload.filePath,payload.filename);
});

ipcMain.handle('UPLOAD_DECAL', async (event, payload) => {
  return gameData.uploadDecal(payload.filePath,payload.filename,payload.bonkId);
});

ipcMain.handle('UPLOAD_WINDUP', async (event, payload) => {
  return gameData.uploadWindup(payload.filePath,payload.filename,payload.bonkId);
});

ipcMain.handle('CREATE_BONK', async (event) => {
  return gameData.createCustomBonk();
});
ipcMain.handle('CLEAR_BONK', async (event, payload) => {
  return gameData.clearCustomBonk(payload.bonkId);
});
ipcMain.handle('CREATE_EVENT', async (event, payload) => {
  console.log('GOT IT');
  let newEvent = gameData.eventData.createEvent(payload.agentKey, payload.triggerKey);
  console.log(newEvent);
  return {success:true, item:newEvent}
});
ipcMain.handle('GET_EVENT_TYPES', async (event) => {
  return agentRegistry.getAvailableTriggers();
});

ipcMain.on('GET_VTS_EXPRESSIONS', async (event, payload) => {
  console.log('got VTS Expression request');
  let expression_result = await agentRegistry.getAgent('vtubestudio').getExpressions();
  console.log(expression_result);
  console.log('sending VTS Expression reply');
  event.reply('GET_VTS_EXPRESSIONS', {success:true,expressions:expression_result});
});

ipcMain.on('GET_VTS_HOTKEYS', async (event, payload) => {
  console.log('got VTS Hotkey request');
  let hotkey_result = await agentRegistry.getAgent('vtubestudio').getHotkeys();
  console.log(hotkey_result);
  console.log('sending VTS Hotkey reply');
  event.reply('GET_VTS_HOTKEYS', {success:true, hotkeys:hotkey_result});
});

ipcMain.on('OPEN_GAME_FOLDER', async (event, payload) => {
  console.log('got Folder Open request');
  shell.openPath(gameData.gameDataFolder);
});

ipcMain.on('CHECK_UPDATE', () => {
  console.log('Checking for Updates...');
  autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.on('RESTART', () => {
  autoUpdater.quitAndInstall();
});




function handleEffect(effect_id) {
  if (!effectQueue.hasOwnProperty(effect_id)) {
    console.log("Could not handle unknown event " + effect_id);
    return false;
  }
  let current_effect = effectQueue[effect_id];
  console.log("Handling event " + current_effect.id);
  let customEvents = gameData.read("crowdControlEvents");
  let matchedEvent = null;
  Object.entries(customEvents).forEach(item => {
    const [key, customEvent] = item;
    if(current_effect.effect.safeName == customEvent.triggerName && customEvent.enabled == true) {
      matchedEvent = customEvent;
      console.log('Found a matching instant event: ' + key);
      console.log(current_effect);
    }
  });

  if(matchedEvent) {
    //Execute the bonk if enabled
    if(matchedEvent.bonkEnabled && matchedEvent.hasOwnProperty("bonkType") && matchedEvent.bonkType.length > 0) {
      let customCount = null;
      if(current_effect.effect.parameters[0] !== undefined) {
        customCount = current_effect.effect.parameters[0];
      }
      console.log('Sending a bonk to the bonker');
      custom(matchedEvent.bonkType,customCount);
    }

    //Execute the hotkey(s) if enabled
    if(matchedEvent.hotkeyEnabled && matchedEvent.hasOwnProperty("hotkeyName") && matchedEvent.hotkeyName.length > 0) {
      //Trigger the selected hotkey
      agentRegistry.eventManager.handleOutputAction('vtubestudio','hotkey',{name: matchedEvent.hotkeyName});
      if(matchedEvent.secondHotkeyEnabled && matchedEvent.hasOwnProperty("secondHotkeyName") && matchedEvent.secondHotkeyName.length > 0) {
        //Trigger the follow-up hotkey after the specified delay
        setTimeout(() => {agentRegistry.getAgent('vtubestudio').triggerHotkey(matchedEvent.secondHotkeyName)},matchedEvent.secondHotkeyDelay);
      }
    }

    //Execute the expression if enabled
    if(matchedEvent.expressionEnabled && matchedEvent.hasOwnProperty("expressionName") && matchedEvent.expressionName.length > 0) {
      //Activate selected expression
      agentRegistry.eventManager.handleOutputAction('vtubestudio','expression',{name: matchedEvent.expressionName, type: 'activate'});
      if(parseInt(matchedEvent.expressionDuration) > 0) {
        //Deactivate expression after the listed duration
        setTimeout(() => {
          agentRegistry.eventManager.handleOutputAction('vtubestudio','expression',{name: matchedEvent.expressionName, type: 'deactivate'});
          },matchedEvent.expressionDuration);
      }
    }

  }

}

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
// Bonks
// -----

// Testing a specific item
ipcMain.on("TEST_CUSTOM_ITEM", (event, message) => testItem(event, message));
ipcMain.on("TEST_CUSTOM_BONK", (_, message) => { console.log('testing bonk ' + message); custom(message); });

function testItem(_, item)
{
  if(agentRegistry.getAgentStatus('overlay') == 'connected') {
    return agentRegistry.eventManager.handleOutputAction('overlay','throwItem',{item: item});
  }
}

// A custom bonk test
function custom(customName,customCount=null)
{
  if(agentRegistry.getAgentStatus('overlay') == 'connected') {
    return agentRegistry.eventManager.handleOutputAction('overlay','throwBonk',{bonk: customName});
  }
}


