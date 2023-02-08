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
appData.setFieldData('bonkerPath', bonkerPath);

let gameData = new GameDataHelper(userDataPath,__static);

//load connections
let agentRegistry = new AgentRegistry(appData,gameData);
let agents = [
    new CrowdControlAgent,
    new VtubeStudioAgent,
    new OverlayAgent
];


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
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    mainWindow.loadURL('app://./index.html')
    autoUpdater.checkForUpdatesAndNotify();
  }

  mainWindow.on("minimize", () => {
    if (appData.getFieldData('minimizeToTray'))
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



ipcMain.on('GET_DATA_PATH', (event, payload) => {
  event.reply('GET_DATA_PATH', userDataPath);
});

ipcMain.on('LOAD_DATA', (event, payload) => {
  console.log('got load request');
  try {
    appData.loadData();
    appData.setFieldData('bonkerPath', bonkerPath);
  } catch {}
  event.reply('LOAD_DATA', appData.getAllData());
});

ipcMain.on('SAVE_DATA', (event, payload) => {
  console.log('got save request');
  let save_success;
  try {
    appData.setAllData(payload);
    appData.saveData();
    save_success = true;
  } catch {}
  console.log('sending save reply');
  event.reply('SAVE_DATA', save_success);
});

ipcMain.on('LOAD_GAME_DATA', (event, payload) => {
  let gameId = payload;
  agentRegistry.getAgent('crowdcontrol').setGame(gameId);
  gameData.loadData(gameId);
  event.reply('LOAD_GAME_DATA', gameData.getAllData());
});

ipcMain.on('SAVE_GAME_DATA', (event, payload) => {
  let save_data = payload.data;
  gameData.setAllData(save_data);
  let save_success = gameData.saveData();
  event.reply('SAVE_GAME_DATA', save_success);
});

ipcMain.on("SET_FIELD", (_, arg) =>
{
  let save_success;
  try {
    appData.setFieldData(field, value);
    appData.saveData();
    save_success = true;
  } catch {}
  _.reply('SET_FIELD', save_success);
});

ipcMain.on('UPLOAD_THROW', (event, payload) => {
  let filePath = payload.file_path;
  let filename = payload.file_name;

  let throwResult = gameData.uploadThrow(filePath,filename);
  event.reply('UPLOAD_THROW', throwResult);
});

ipcMain.on('UPLOAD_IMPACT', (event, payload) => {
  let filePath = payload.file_path;
  let filename = payload.file_name;

  let impactResult = gameData.uploadImpact(filePath,filename);
  event.reply('UPLOAD_IMPACT', impactResult);
});

ipcMain.on('UPLOAD_DECAL', (event, payload) => {
  let filePath = payload.file_path;
  let filename = payload.file_name;
  let currentBonk = payload.current_bonk;

  let decalResult = gameData.uploadDecal(filePath,filename,currentBonk);
  event.reply('UPLOAD_DECAL', decalResult);
});

ipcMain.on('UPLOAD_WINDUP', (event, payload) => {
  let filePath = payload.file_path;
  let filename = payload.file_name;
  let currentBonk = payload.current_bonk;

  let windupResult = gameData.uploadWindup(filePath,filename,currentBonk);
  event.reply('UPLOAD_WINDUP', windupResult);
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
  let customEvents = gameData.getFieldData("crowdControlEvents");
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
ipcMain.on("TEST_CUSTOM_BONK", (_, message) => { custom(message); });

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


