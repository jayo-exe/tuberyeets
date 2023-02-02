'use strict'

import {app, protocol, BrowserWindow, Tray, Menu, ipcMain, shell} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import path from 'path';
import fs from 'fs';
import { WebSocket } from 'ws';
import { io } from "socket.io-client";
import GameDataHelper from './gameDataHelper';
import AppDataHelper from './appDataHelper';
import AgentRegistry from './agentRegistry';
import VtubeStudioAgent from './agents/vtubeStudioAgent';
import OverlayAgent from './agents/overlayAgent';
import TimedEffectAgent from './timedEffectAgent';
const isDevelopment = process.env.NODE_ENV !== 'production'
const { autoUpdater } = require('electron-updater');

const userDataPath = app.getPath('userData');
const defaultGameDataPath = path.resolve(__static, 'data/defaultGameData.json');
const defaultGameData = JSON.parse(fs.readFileSync(defaultGameDataPath, "utf8"));

let bonkRoot = (app.isPackaged ? '../' : '')+'../public/bonker';
let portsPath = path.resolve(__static, bonkRoot+'/ports.js');
let bonkerPath = path.resolve(__static, bonkRoot+'/bonker.html');

// Loading core data file
let appData = new AppDataHelper(userDataPath);
appData.loadData();
appData.setFieldData('bonkerPath', bonkerPath);

let crowdControlGame = 0;
let gameDataFolder = '';
let gdh = new GameDataHelper();

//load connections
let agentRegistry = new AgentRegistry(appData,gdh);
let agents = [
  new VtubeStudioAgent,
  new OverlayAgent
];


// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
]);

var mainWindow;

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

var tray = null, contextMenu;

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

var crowdControlConnected = false;

// Periodically reporting status back to renderer
var exiting = false;
setInterval(() => {
  var vtsStatus = agentRegistry.getAgentStatus('vtubestudio');
  var overlayStatus = agentRegistry.getAgentStatus('overlay');
  var calibrateStage = agentRegistry.getAgent('overlay').getCalibrateStage();
  if (mainWindow != null)
  {
    var status = 0;
    if (crowdControlConnected === false)
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

function setPorts() {
  var old_port_data = fs.readFileSync(portsPath, "utf8");
  var new_port_data = "const ports = [ " + appData.getFieldData('portThrower') + ", " + appData.getFieldData('portVTubeStudio') + " ];"
  if(old_port_data !== new_port_data) {
    fs.writeFileSync(portsPath, new_port_data);
  }
}

function checkGameFolder(game_id) {
  const gameDataPath = path.join(userDataPath, 'gamedata');
  if (!fs.existsSync(gameDataPath))
    fs.mkdirSync(gameDataPath);

  const gamePath = path.join(gameDataPath, game_id.toString());
  if (!fs.existsSync(gamePath))
    fs.mkdirSync(gamePath);

  if (!fs.existsSync(gamePath +'/throws/'))
    fs.mkdirSync(gamePath +'/throws/');
  if (!fs.existsSync(gamePath +'/decals/'))
    fs.mkdirSync(gamePath +'/decals/');
  if (!fs.existsSync(gamePath +'/impacts/'))
    fs.mkdirSync(gamePath +'/impacts/');
  if (!fs.existsSync(gamePath +'/windups/'))
    fs.mkdirSync(gamePath +'/windups/');
  if (!fs.existsSync(gamePath +'/data.json'))
    fs.writeFileSync(gamePath +'/data.json', JSON.stringify(defaultGameData));
  return gamePath;
}

ipcMain.on('GET_DATA_PATH', (event, payload) => {
  event.reply('GET_DATA_PATH', userDataPath);
});

ipcMain.on('LOAD_DATA', (event, payload) => {
  console.log('got load request');
  try {
    appData.loadData();
    appData.setFieldData('bonkerPath', bonkerPath);
    setPorts();
  } catch {}
  event.reply('LOAD_DATA', appData.getAllData());
});

ipcMain.on('SAVE_DATA', (event, payload) => {
  console.log('got save request');
  var save_success;
  try {
    appData.setAllData(payload);
    appData.saveData();
    setPorts();
    save_success = true;
  } catch {}
  console.log('sending save reply');
  event.reply('SAVE_DATA', save_success);
});

ipcMain.on('LOAD_GAME_DATA', (event, payload) => {
  console.log('Loading game-specific data...');
  var game_id = payload;
  checkGameFolder(game_id);
  crowdControlGame = game_id;
  gameDataFolder = path.join(userDataPath, 'gamedata/'+game_id);
  const gameDataPath = path.join(gameDataFolder, 'data.json');
  var gdata;
  try {
    gdata = JSON.parse(fs.readFileSync(gameDataPath, "utf8"));
    gdata.game_data_path = checkGameFolder(game_id);
    gdh.setGameData(gdata);
    console.log('Successfully Loaded game-specific data!');
  } catch(e) {
    console.log(e);
  }
  event.reply('LOAD_GAME_DATA', gdata);
});

ipcMain.on('SAVE_GAME_DATA', (event, payload) => {
  console.log('got game save request');
  var game_id = payload.game_id;
  var save_data = payload.data;
  checkGameFolder(game_id);
  const gameDataPath = path.join(userDataPath, 'gamedata/'+game_id+'/data.json');

  var save_success;
  try {
    fs.writeFileSync(gameDataPath, JSON.stringify(save_data));
    save_data.game_data_path = checkGameFolder(game_id);
    gdh.setGameData(save_data);
    save_success = true;
  } catch {}

  console.log('sending game save reply');
  event.reply('SAVE_GAME_DATA', save_success);
});

ipcMain.on("SET_FIELD", (_, arg) =>
{
  var save_success;
  try {
    setData(arg[0], arg[1], true);
    save_success = true;
  } catch {}
  _.reply('SET_FIELD', save_success);
});

function setData(field, value, external)
{
  appData.setFieldData(field, value);
  appData.saveData();
  if(field == "portVTubeStudio") {
    agentRegistry.setAgentFieldData('vtubestudio', 'port', value);
  }
  if (external)
    mainWindow.webContents.send("doneWriting");
}

ipcMain.on('UPLOAD_THROW', (event, payload) => {
  console.log('got upload throw request');
  var game_id = payload.game_id;
  var file_path = payload.file_path;
  var file_name = payload.file_name;

  var throw_result = uploadThrow(game_id,file_path,file_name);
  console.log(throw_result);
  console.log('sending upload throw reply');
  event.reply('UPLOAD_THROW', throw_result);
});

ipcMain.on('UPLOAD_IMPACT', (event, payload) => {
  console.log('got upload impact request');
  var game_id = payload.game_id;
  var file_path = payload.file_path;
  var file_name = payload.file_name;

  var impact_result = uploadImpact(game_id,file_path,file_name);
  console.log(impact_result);
  console.log('sending upload impact reply');
  event.reply('UPLOAD_IMPACT', impact_result);
});

ipcMain.on('UPLOAD_DECAL', (event, payload) => {
  console.log('got upload decal request');
  var game_id = payload.game_id;
  var file_path = payload.file_path;
  var file_name = payload.file_name;
  var current_bonk = payload.current_bonk;
  var decal_result = uploadDecal(game_id,file_path,file_name,current_bonk);
  console.log(decal_result);
  console.log('sending upload decal reply');
  event.reply('UPLOAD_DECAL', decal_result);
});

ipcMain.on('UPLOAD_WINDUP', (event, payload) => {
  console.log('got upload windup request');
  var game_id = payload.game_id;
  var file_path = payload.file_path;
  var file_name = payload.file_name;
  var current_bonk = payload.current_bonk;
  var windup_result = uploadWindup(game_id,file_path,file_name,current_bonk);
  console.log(windup_result);
  console.log('sending upload windup reply');
  event.reply('UPLOAD_WINDUP', windup_result);
});

ipcMain.on('GET_VTS_EXPRESSIONS', async (event, payload) => {
  console.log('got VTS Expression request');
  var expression_result = await agentRegistry.getAgent('vtubestudio').getExpressions();
  console.log(expression_result);
  console.log('sending VTS Expression reply');
  event.reply('GET_VTS_EXPRESSIONS', {success:true,expressions:expression_result});
});

ipcMain.on('GET_VTS_HOTKEYS', async (event, payload) => {
  console.log('got VTS Hotkey request');
  var hotkey_result = await agentRegistry.getAgent('vtubestudio').getHotkeys();
  console.log(hotkey_result);
  console.log('sending VTS Hotkey reply');
  event.reply('GET_VTS_HOTKEYS', {success:true, hotkeys:hotkey_result});
});

ipcMain.on('OPEN_GAME_FOLDER', async (event, payload) => {
  console.log('got Folder Open request');
  shell.openPath(gameDataFolder);
});

ipcMain.on('CHECK_UPDATE', () => {
  console.log('Checking for Updates...');
  autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.on('RESTART', () => {
  autoUpdater.quitAndInstall();
});

function checkFilename(game_id, folder, file_name) {
  const game_path = checkGameFolder(game_id);
  // Ensure that we're not overwriting any existing files with the same name
  // If a file already exists, add an interating number to the end until it"s a unique filename
  var append = "";

  while (fs.existsSync(game_path + "/"+folder+"/" + file_name.substr(0, file_name.lastIndexOf(".")) + append + file_name.substr(file_name.lastIndexOf("."))))
    append = append == "" ? 2 : (append + 1);

  var filename = file_name.substr(0, file_name.lastIndexOf(".")) + append + file_name.substr(file_name.lastIndexOf("."));
  return {
    file_path: game_path + "/"+folder+"/" + filename,
    file_name: filename
  };
}

function uploadThrow(game_id, file_path, file_name)
{
  try {
    var file_info = checkFilename(game_id, "throws", file_name);
    fs.copyFileSync(file_path, file_info.file_path);
    var throw_item = {
      "enabled": true,
      "location": file_info.file_name,
      "weight": 1.0,
      "scale": 1.0,
      "sound": null,
      "volume": 1.0,
      "customs": []
    }
    var return_value = {
      success: true,
      throw_item: throw_item
    }
  } catch (e) {
    var return_value = {
      success: false,
    };
    console.log(e);
  }

  return return_value;

}

function uploadImpact(game_id, file_path, file_name)
{
  try {
    var file_info = checkFilename(game_id, "impacts", file_name);
    fs.copyFileSync(file_path, file_info.file_path);
    var impact_item = {
      "enabled": false,
      "location": file_info.file_name,
      "volume": 1.0,
      "customs": [],
    }
    var return_value = {
      success: true,
      impact_item: impact_item,
    }
  } catch (e) {
    var return_value = {
      success: false,
    };
    console.log(e);
  }

  return return_value;

}

function uploadDecal(game_id, file_path, file_name, current_bonk)
{
  try {
    var file_info = checkFilename(game_id, "decals", file_name);
    fs.copyFileSync(file_path, file_info.file_path);
    var decal_item = {
      "enabled": true,
      "location": file_info.file_name,
      "scale": 1,
      "duration": 0.25,
    }
    var return_value = {
      success: true,
      decal_item: decal_item,
      current_bonk: current_bonk
    }
  } catch (e) {
    var return_value = {
      success: false,
    };
    console.log(e);
  }

  return return_value;

}
function uploadWindup(game_id, file_path, file_name, current_bonk)
{
  try {
    var file_info = checkFilename(game_id, "windups", file_name);
    fs.copyFileSync(file_path, file_info.file_path);
    var windup_item = {
      "enabled": true,
      "location": file_info.file_name,
      "volume": 1,
    }
    var return_value = {
      success: true,
      windup_item: windup_item,
      current_bonk: current_bonk
    }
  } catch (e) {
    var return_value = {
      success: false,
    };
    console.log(e);
  }

  return return_value;

}

// ----------------
// Crowd Control Connection
// ----------------
let cc_socket = null;
createCrowdControlConnection();
function createCrowdControlConnection()
{
  cc_socket = io("wss://overlay-socket.crowdcontrol.live");
  cc_socket.on("effect-initial", (args) => {
    console.log("Socket A");
    checkCrowdControlEventInitial(args);
  });
  cc_socket.on("effect-update", (args) => {
    console.log("Socket B");
    checkCrowdControlEventUpdate(args);
  });

  cc_socket.onAny((eventName, ...args) => {
    console.log(eventName + " event received from Crowd Control");
  });

  cc_socket.on("connect", () => {
    console.log("CC Socket: Connected to Crowd Control!! Socket ID: " + cc_socket.id);
    console.log("CC Socket: Getting events from channel " + appData.getFieldData('cc_channel'));
    cc_socket.emit("events", appData.getFieldData('cc_channel'));
    crowdControlConnected = true;
  });

  cc_socket.on("disconnect", () => {
    console.log("CC Socket: Disconnected from Crowd Control! ");
    crowdControlConnected = false;
  });

  cc_socket.io.on("error", (error) => {
    console.log("CC Socket Error: " + error);
  });

}

var effectQueue = {};

// ----------------
// VTube Studio Connection
// ----------------
const vts = new VtubeStudioAgent(appData.getFieldData('portVTubeStudio'));
var lastCrowdControlEventId = '';
function checkCrowdControlEventInitial(effect_object) {
  console.log(effect_object);
  //Initial event feed.  We use this to add a new entity to the list
  if (!effectQueue.hasOwnProperty(effect_object.id)) {

    var targeted = false;
    if(effect_object.hasOwnProperty('targets')) {
      effect_object.targets.forEach((target) => {
        if (target.name === appData.getFieldData('cc_channel').toLowerCase()) {
          targeted = true;
        }
      });
    } else {
      targeted = true;
    }

    if(targeted == true) {
      effectQueue[effect_object.id] = {...effect_object};

      effectQueue[effect_object.id].timed_effect = false;
      if (effect_object.effect.duration > 0) effectQueue[effect_object.id].timed_effect = true;
      effectQueue[effect_object.id].last_update = "added";
      console.log(`Registering CC Event: "${effect_object.id}"`);
    }
  }
}

function checkCrowdControlEventUpdate(effect_object) {

    //This is an update to an effect.  We use this to queue/unqueue/complete effects, as well as start/stop/pause/resume timed effects
    if (effectQueue.hasOwnProperty(effect_object.id)) {
      var current_effect = effectQueue[effect_object.id];
      current_effect.last_update = effect_object.type;
      var effect_handlers =  gdh.getData("crowdControlEvents");
      var matched_handler = null;
      Object.entries(effect_handlers).forEach(item => {
        const [key, effect_handler] = item;
        if(current_effect.effect.safeName == effect_handler.triggerName && effect_handler.enabled == true) {
          console.log(`Found matching handler for "${effect_handler.triggerName}"!`);
          matched_handler = effect_handler;
        }
      });
      console.log(`Detected effect update of type: "${effect_object.type}" for "${effect_object.id}"`);
      console.log(effect_object);
      switch (effect_object.type) {
        case "queue":
          if (current_effect.last_update !== "queue") {
            // code block
            console.log(`Queued effect: "${effect_object.id}"`);
          }
          break;
        case "unqueue":
          console.log(`Unqueued and removed effect: "${effect_object.id}"`);
          delete effectQueue[effect_object.id];
          break;
        case "completed":
          if (current_effect.timed_effect === false) {
            if(matched_handler) {
              console.log(`Handling matched effect: "${effect_object.id}"`);
              handleEffect(effect_object.id);
            }
            console.log(`Completed and removed effect: "${effect_object.id}"`);
          } else {
            console.log(`Handling Timed effect: "${effect_object.id}"`);
            if(matched_handler) {
              current_effect.agent = new TimedEffectAgent(appData.getAllData(),vts,gdh,gameDataFolder,socket,current_effect,matched_handler);
            }
          }
          break;
        case "start":
          if(matched_handler) {
            if (!current_effect.hasOwnProperty('agent')) {
              //This is mostly to avoid errors from weirdness in the CC test effect
              current_effect.agent = new TimedEffectAgent(appData.getAllData(), vts, gdh, gameDataFolder, socket, current_effect, matched_handler);
            }
            try {
              current_effect.agent.start();
            } catch (e) {
              console.log(`Effect not found in internal queue: "${effect_object.id}"`);
            }
          }
          break;
        case "pause":
          if(matched_handler) {
            try {
              current_effect.agent.pause(effect_object.effect.duration);
            } catch (e) {
              console.log(`Effect not found in internal queue: "${effect_object.id}"`);
            }
          }
          break;
        case "resume":
          if(matched_handler) {
            try {
              current_effect.agent.resume(effect_object.effect.duration);
            } catch (e) {
              console.log(`Effect not found in internal queue: "${effect_object.id}"`);
            }
          }
          break;
        case "stop":
          if(matched_handler) {
            try {
              current_effect.agent.stop();
              delete effectQueue[effect_object.id];
              console.log(`Stopped and removed effect: "${effect_object.id}"`);
            } catch (e) {
              console.log(`Effect not found in internal queue: "${effect_object.id}"`);
            }

          }
          break;
        default:
          // we don't handle this type of update
      }
    } else {
      console.log(`Update for unknown effect: "${effect_object.id}"`);
    }
}

function handleEffect(effect_id) {
  if (!effectQueue.hasOwnProperty(effect_id)) {
    console.log("Could not handle unknown event " + effect_id);
    return false;
  }
  var current_effect = effectQueue[effect_id];
  console.log("Handling event " + current_effect.id);
  var customEvents = gdh.getData("crowdControlEvents");
  var matchedEvent = null;
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
      var customCount = null;
      if(current_effect.effect.parameters[0] !== undefined) {
        customCount = current_effect.effect.parameters[0];
      }
      console.log('Sending a bonk to the bonker');
      custom(matchedEvent.bonkType,customCount);
    }

    //Execute the hotkey(s) if enabled
    if(matchedEvent.hotkeyEnabled && matchedEvent.hasOwnProperty("hotkeyName") && matchedEvent.hotkeyName.length > 0) {
      //Trigger the selected hotkey
      agentRegistry.handleOutputAction('vtubestudio','hotkey',{name: matchedEvent.hotkeyName});
      if(matchedEvent.secondHotkeyEnabled && matchedEvent.hasOwnProperty("secondHotkeyName") && matchedEvent.secondHotkeyName.length > 0) {
        //Trigger the follow-up hotkey after the specified delay
        setTimeout(() => {agentRegistry.getAgent('vtubestudio').triggerHotkey(matchedEvent.secondHotkeyName)},matchedEvent.secondHotkeyDelay);
      }
    }

    //Execute the expression if enabled
    if(matchedEvent.expressionEnabled && matchedEvent.hasOwnProperty("expressionName") && matchedEvent.expressionName.length > 0) {
      //Activate selected expression
      agentRegistry.handleOutputAction('vtubestudio','expression',{name: matchedEvent.expressionName, type: 'activate'});
      if(parseInt(matchedEvent.expressionDuration) > 0) {
        //Deactivate expression after the listed duration
        setTimeout(() => {
          agentRegistry.handleOutputAction('vtubestudio','expression',{name: matchedEvent.expressionName, type: 'deactivate'});
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
    return agentRegistry.handleOutputAction('overlay','throwItem',{item: item});
  }
}

// A custom bonk test
function custom(customName,customCount=null)
{
  if(agentRegistry.getAgentStatus('overlay') == 'connected') {
    return agentRegistry.handleOutputAction('overlay','throwBonk',{bonk: customName});
  }
}


