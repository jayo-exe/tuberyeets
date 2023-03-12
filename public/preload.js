const { contextBridge, ipcRenderer, app} = require('electron');

const validChannels = [
    'CHECK_UPDATE',
    'UPDATE_AVAILABLE',
    'UPDATE_DOWNLOADED',
    'RESTART',
    'LOAD_DATA',
    'SAVE_STATUS',
    'LOAD_GAME_DATA',
    'SAVE_GAME_DATA',
    'GAME_SAVE_STATUS',
    'SET_FIELD',
    'SET_GAME_FIELD',
    'APP_CRUD',
    'GAME_CRUD',
    'APP_CRUD_SYNC',
    'GAME_CRUD_SYNC',
    'GAME_STATS',
    'STATUS',
    'AGENT_STATUS',
    'SET_GAME',
    'EFFECT_QUEUE',
    'GET_DATA_PATH',
    'CALIBRATE_START',
    'CALIBRATE_NEXT',
    'CALIBRATE_CANCEL',
    'UPLOAD_THROW',
    'UPLOAD_IMPACT',
    'UPLOAD_SOUND',
    'UPLOAD_DECAL',
    'UPLOAD_WINDUP',
    'CREATE_BONK',
    'CLEAR_BONK',
    'CREATE_EVENT',
    'GET_EVENT_TYPES',
    'GET_VTS_EXPRESSIONS',
    'GET_VTS_HOTKEYS',
    'OPEN_GAME_FOLDER',
    'TEST_SINGLE',
    'TEST_BARRAGE',
    'TEST_CUSTOM_ITEM',
    'TEST_CUSTOM_BONK'
];

contextBridge.exposeInMainWorld(
    'ipc', {
        send: (channel, ...data) => {
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel,... data);
            }
        },
        sendSync: (channel, ...data) => {
            if (validChannels.includes(channel)) {
                return ipcRenderer.sendSync(channel, ...data);
            }
        },
        invoke: (channel, ...data) => {
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, ...data);
            }
        },
        on: (channel, func) => {
            if (validChannels.includes(channel)) {
                // Strip event as it includes `sender` and is a security risk
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
    },

);