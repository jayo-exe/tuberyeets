const { WebSocket } = require("ws");

module.exports = class OverlayAgent {

    constructor() {
        this.socketServer = null;
        this.socketClient = null;
        this.portInUse = false;
        this.calibrateStage = -2;
        this.overlayVTSConnected = false;
        this.overlayConnected = false;
        this.agentRegistry = null;
        this.agentName = 'Overlay';
        this.agentDescription = 'Throw items at your model, play sounds, and more!';
        this.agentKey = 'overlay';
        this.agentLabel = 'Overlay';
        this.agentSettingsForm = 'OverlaySettings';
        this.agentSettings = [
            {
                key: "enabled",
                label: "Enabled",
                type: "toggle",
                settable: false,
                default: false
            },
            {
                key: "vtsOverlayAuthKey",
                label: "VTS API Token for Overlay",
                type: "text",
                settable: false,
                default: ""
            },
            {
                key: "port",
                label: "Overlay Port",
                help: "The TCP Port that the overlay will use to connect to TuberYeets. If you change this, your overlay URL will also change",
                type: "text",
                settable: true,
                default: "8081"
            },
            {
                key: "volume",
                label: "Master Volume",
                help: "The master volume for all Overlay sounds",
                type: "number",
                step: "0.01",
                min: 0.00,
                max: 1.00,
                settable: true,
                default: "1.00"
            },
            {
                key: "groupCount",
                label: "Group Quantity",
                help: "The number of randomly-selected items that are thrown in an Item Group",
                type: "number",
                step: "1",
                min: 1,
                settable: true,
                default: "20"
            },
            {
                key: "groupFrequency",
                label: "Group Frequency",
                help: "The delay (in seconds) between items that are thrown as an Item Group",
                type: "number",
                step: "0.01",
                settable: true,
                default: "0.2"
            },
            {
                key: "itemScaleMin",
                label: "Minimum Item Scale",
                help: "The minimum scale factor for randomly-sizing thrown items",
                type: "number",
                step: "0.01",
                min: 0,
                settable: true,
                default: "0.25"
            },
            {
                key: "itemScaleMax",
                label: "Maximum Item Scale",
                help: "The maximum scale factor for randomly-sizing thrown items",
                type: "number",
                step: "0.01",
                min: 0,
                settable: true,
                default: "2.00"
            },
            {
                key: "throwAngleMin",
                label: "Minimum Throw Angle",
                help: "The minimum incoming angle for thrown items",
                type: "number",
                step: "1",
                settable: true,
                default: "-45"
            },
            {
                key: "throwAngleMax",
                label: "Maximum Throw Angle",
                help: "The maximum incoming angle for thrown items",
                type: "number",
                step: "1",
                settable: true,
                default: "45"
            },
            {
                key: "spinSpeedMin",
                label: "Minimum Spin Speed",
                help: "The minimum random rotational rate for thrown items",
                type: "number",
                step: "0.1",
                settable: true,
                default: "5.0"
            },
            {
                key: "spinSpeedMax",
                label: "Maximum Spin Speed",
                help: "The maximum random rotational rate for thrown items",
                type: "number",
                step: "0.1",
                settable: true,
                default: "10.0"
            },
            {
                key: "throwDuration",
                label: "Throw Duration",
                help: "The number of seconds that the 'Item Throw' animation plays out",
                type: "number",
                step: "0.01",
                settable: true,
                default: "1.00"
            },
            {
                key: "returnSpeed",
                label: "(VTS) Model Return Speed",
                help: "The number of seconds it takes the model to return to position after an impact",
                type: "number",
                step: "0.01",
                settable: true,
                default: "0.1"
            },
            {
                key: "closeEyes",
                label: "(VTS) Close Eyes on Impact",
                help: "If enabled, an item impacting the model will close their eyes",
                type: "toggle",
                settable: true,
                default: false
            },
            {
                key: "openEyes",
                label: "(VTS) Open Eyes on Impact",
                help: "If enabled, an item impacting the model will open their eyes",
                type: "toggle",
                settable: true,
                default: false
            },
        ];
        this.agentInputs = {};
        this.agentOutputs = {
            throwItem: {
                'key': 'throwItem',
                'label': 'Throw an Item',
                'description': 'Throw an item from the TuberYeets library',
                'handler': "handleThrowItemOutput",
                'settings': [
                    {
                        'key': 'item',
                        'label': 'Item',
                        'type': 'list',
                        'optionsLoader': "getThrowItemOutputOptions",
                        'default': ''
                    },
                    {
                        'key': 'match_quantity',
                        'label': 'Match Quantity to Event Parameter',
                        'type': 'toggle',
                        'default': false
                    },
                    {
                        'key': 'quantity',
                        'label': 'Quantity',
                        'type': 'integer',
                        'hideIfToggled': "match_quantity",
                        'default': 1
                    },
                    {
                        'key': 'quantity_parameter',
                        'label': 'Event Parameter',
                        'type': 'text',
                        'showIfToggled': "match_quantity",
                        'default': ''
                    },
                ]
            },
            throwItemGroup: {
                'key': 'throwItemGroup',
                'label': 'Throw a Group of Items',
                'description': 'Throw an Item Group from the TuberYeets library',
                'handler': "handleThrowItemGroupOutput",
                'settings': [
                    {
                        'key': 'itemGroup',
                        'label': 'Item Group',
                        'type': 'list',
                        'optionsLoader': "getThrowItemGroupOutputOptions",
                        'default': ''
                    }
                ]
            },
            playSound: {
                'key': 'playSound',
                'label': 'Play a Sound',
                'description': 'Play a Sound from the TuberYeets library',
                'handler': "handlePlaySoundOutput",
                'settings': [
                    {
                        'key': 'sound',
                        'label': 'Sound',
                        'type': 'list',
                        'optionsLoader': "getPlaySoundOutputOptions",
                        'default': ''
                    }
                ]
            },
        };

    }

    agentRegistered(agentRegistry) {
        console.log("[OverlayAgent] running agentRegistered()...");
        this.agentRegistry = agentRegistry;
        if(this.agentRegistry.getAgentFieldData(this,'enabled')) {
            this.agentEnabled();
        }
    }

    agentEnabled() {
        console.log("[OverlayAgent] Agent Enabled.");
        this.createServer();
    }

    agentDisabled() {
        if(this.socketServer) {
            if (this.socketServer.readyState !== WebSocket.CLOSED) {
                this.socketServer.close();
            }
        }
        console.log("[OverlayAgent] Agent Disabled.");
    }

    agentStatus() {
        let vtsStatus = this.agentRegistry.getAgentStatus('vtubestudio');
        if(!this.agentRegistry.getAgentFieldData(this,'enabled')) {
            return 'disabled';
        }
        let status = 'waiting';
        if(this.portInUse) {
            status = 'port-in-use';
        }
        if(this.overlayConnected) {
            if(this.overlayVTSConnected || vtsStatus == 'disabled') {
                status = 'connected';
            } else {
                status = 'wait-for-vts';
            }
        }
        return status;
    }

    async getThrowItemOutputOptions() {
        let item_list = this.agentRegistry.gameData.read('throws');
        let item_options = [];
        item_list.forEach((item) => {
            item_options.push({'label': item.location, 'value': item.id});
        });
        return item_options;
    }

    handleThrowItemOutput(values) {
        this.throwItem(values.item);
    }

    async getThrowItemGroupOutputOptions() {
        let item_group_list = this.agentRegistry.gameData.read('itemGroups');
        let item_group_options = [];
        for (const [key, item_group] of Object.entries(item_group_list)) {
            item_group_options.push({'label': item_group.name, 'value': key});
        }
        return item_group_options;
    }

    handleThrowItemGroupOutput(values) {
        this.throwItemGroup(values.itemGroup);
    }

    async getPlaySoundOutputOptions() {
        let sound_list = this.agentRegistry.gameData.read('impacts');
        let sound_options = [];
        sound_list.forEach((sound) => {
            sound_options.push({'label': sound.location, 'value': sound.location});
        });
        return sound_options;
    }

    handlePlaySoundOutput(values) {
        this.playSound(values.sound);
    }

    createServer() {
        this.portInUse = false;
        let targetPort = this.agentRegistry.getAgentFieldData(this,'port');
        this.socketServer = new WebSocket.Server({ port: targetPort });
        this.socketServer.on("error", (err) => { this.socketServerHandleError(err) } );
        this.socketServer.on("close", (err) => { this.socketServerHandleClose() } );
        if(this.portInUse) { return; }
        console.log("[OverlayAgent] Socket Server Started on port "+targetPort+"!");
        this.socketServer.on("connection", (ws) => { this.socketServerHandleConnection(ws) });
    }

    socketServerHandleError(err) {
        this.portInUse = true;
        console.log("[Overlay Agent] Socket Error: ", err)
        // Retry server creation after 3 seconds
        setTimeout(() => {
            this.createServer()
        }, 3000);
    }

    socketServerHandleClose() {
        console.log("[OverlayAgent] Socket Server Closed!");
        this.socketServer = null;
        this.overlayConnected = false;
        this.calibrateStage = -2;
    }

    socketServerHandleConnection(ws) {
        this.portInUse = false;
        this.socketClient = ws;
        this.overlayConnected = true;
        this.socketClient.on("message", (request) => { this.socketClientHandleMessage(request) });
        this.socketClient.on("close", () => {this.socketClientHandleClose() });

    }

    socketClientHandleClose() {
        console.log("[OverlayAgent] Socket Client Disconnected!");
        this.socketClient = null;
        this.overlayConnected = false;
        this.calibrateStage = -2;
    }

    socketClientHandleMessage(request) {
        request = JSON.parse(request);

        if (request.type == "calibrating")
        {
            switch (request.stage)
            {
                case "min":
                    if (request.size > -99)
                    {
                        this.calibrateStage = 0;
                        this.proceedCalibration();
                    }
                    else
                    {
                        this.agentRegistry.setAgentFieldData(this,request.modelID + "Min", [ request.positionX, request.positionY ]);
                        this.calibrateStage = 2;
                        this.proceedCalibration();
                    }
                    break;
                case "max":
                    if (request.size < 99)
                    {
                        this.calibrateStage = 2;
                        this.proceedCalibration();
                    }
                    else
                    {
                        this.agentRegistry.setAgentFieldData(this,request.modelID + "Max", [ request.positionX, request.positionY ]);
                        this.calibrateStage = 4;
                        this.proceedCalibration();
                    }
                    break;
            }
        } else if (request.type == "status") {
            this.overlayVTSConnected = request.connectedOverlayVTube;
        } else if (request.type == "calibrate-status") {
            console.log('[Overlay] Calibration Status updated',request);
            this.calibrateStage = request.stageId;
        } else if (request.type == "vtsRequest") {
            let vtsAgent = this.agentRegistry.getAgent('vtubestudio');

            let response =
                {
                    "type": "vtsResponse",
                    "enabled": this.agentRegistry.getAgentFieldData(vtsAgent,'enabled'),
                    "port": this.agentRegistry.getAgentFieldData(vtsAgent,'port'),
                    "authKey": this.agentRegistry.getAgentFieldData(this,'vtsOverlayAuthKey')
                }
            this.socketClient.send(JSON.stringify(response));
        } else if (request.type == "vtsAuth") {
            this.agentRegistry.setAgentFieldData(this,'vtsOverlayAuthKey', request.authKey);
        }
    }

    getAppSettings() {
        return {
            groupCount: Number(this.agentRegistry.getAgentFieldData(this,'groupCount')),
            groupFrequency: Number(this.agentRegistry.getAgentFieldData(this,'groupFrequency')),
            throwAngleMin: Number(this.agentRegistry.getAgentFieldData(this,'throwAngleMin')),
            throwAngleMax: Number(this.agentRegistry.getAgentFieldData(this,'throwAngleMax')),
            itemScaleMin: Number(this.agentRegistry.getAgentFieldData(this,'itemScaleMin')),
            itemScaleMax: Number(this.agentRegistry.getAgentFieldData(this,'itemScaleMax')),
            throwDuration: Number(this.agentRegistry.getAgentFieldData(this,'throwDuration')),
            delay: Number(this.agentRegistry.getAgentFieldData(this,'delay')),
            spinSpeedMin: Number(this.agentRegistry.getAgentFieldData(this,'spinSpeedMin')),
            spinSpeedMax: Number(this.agentRegistry.getAgentFieldData(this,'spinSpeedMax')),
            volume: Number(this.agentRegistry.getAgentFieldData(this,'volume')),
            closeEyes: this.agentRegistry.getAgentFieldData(this,'closeEyes'),
            openEyes: this.agentRegistry.getAgentFieldData(this,'openEyes'),
            returnSpeed: Number(this.agentRegistry.getAgentFieldData(this,'returnSpeed')),
        };
    }

    proceedCalibration()
    {
        var request = {
            "type": "calibrating",
            "stage": this.calibrateStage
        }
        this.socketClient.send(JSON.stringify(request));
    }

    startCalibration() {
        console.log('[OverlayAgent] Starting VTS Calibration');
        this.calibrateStage = -1;
        this.proceedCalibration();
    }

    nextCalibration() {
        console.log('[OverlayAgent] Continuing VTS Calibration');
        this.calibrateStage ++;
        this.proceedCalibration();
    }

    cancelCalibration() {
        console.log('[OverlayAgent] Cancelling VTS Calibration');
        this.calibrateStage = 4;
        this.proceedCalibration();
    }

    getCalibrateStage() {
        return this.calibrateStage;
    }

    throwItem(itemId) {
        console.log(`[OverlayAgent] Sending Custom Item ${itemId}`);
        let gdh = this.agentRegistry.gameData;

        let itemDetails = gdh.itemGroupEventHelper.getItemById(itemId);
        if(itemDetails === null) {
            console.log('[OverlayAgent] Failed to Send Single Item:  Item could not be generated!');
            return;
        }

        let request = {
            ...itemDetails,
            ...{
                "type": "single",
                "masterVolume": Number(this.agentRegistry.getAgentFieldData(this,'volume')),
                "appSettings": this.getAppSettings(),
                "game_data_path": gdh.read(`game_data_path`)
            }
        };

        if(this.agentRegistry.getAgentStatus('vtubestudio') === "connected") {
            this.agentRegistry.getAgent('vtubestudio').getModelId().then(currentModelId => {
                console.log('current model:',currentModelId);
                if(currentModelId) {
                    console.log('current model:',currentModelId);
                    request.modelCalibration = {
                        "faceWidthMin": this.agentRegistry.getAgentFieldData(this,`${currentModelId}Min`)[0],
                        "faceHeightMin": this.agentRegistry.getAgentFieldData(this,`${currentModelId}Min`)[1],
                        "faceWidthMax": this.agentRegistry.getAgentFieldData(this,`${currentModelId}Max`)[0],
                        "faceHeightMax": this.agentRegistry.getAgentFieldData(this,`${currentModelId}Max`)[1],
                    }
                }
                this.socketClient.send(JSON.stringify(request));
            });
            return;
        } else {
            this.socketClient.send(JSON.stringify(request));
        }

    }

    throwItemGroup(itemGroupId,customCount=null) {
        console.log('[OverlayAgent] Sending Item Group');
        let gdh = this.agentRegistry.gameData;
        const itemsForGroup = gdh.itemGroupEventHelper.getItemsForGroup(itemGroupId,customCount);
        let images = [], weights = [], scales = [], sounds = [], volumes = [], impactDecals = [], windupSounds = [];
        for (let i = 0; i < itemsForGroup.length; i++) {
            images[i] = itemsForGroup[i].image;
            weights[i] = itemsForGroup[i].weight;
            scales[i] = itemsForGroup[i].scale;
            sounds[i] = itemsForGroup[i].sound;
            volumes[i] = itemsForGroup[i].volume;
            impactDecals[i] = itemsForGroup[i].impactDecal;
            windupSounds[i] = itemsForGroup[i].windupSound;
        }

        let request = {
            "type": itemGroupId,
            "image": images,
            "weight": weights,
            "scale": scales,
            "sound": sounds,
            "volume": volumes,
            "masterVolume": this.agentRegistry.appData.read('volume'),
            "impactDecal": impactDecals,
            "windupSound": windupSounds,
            "appSettings": this.getAppSettings(),
            "itemGroup": gdh.read(`itemGroups.${itemGroupId}`),
            "game_data_path": gdh.read(`game_data_path`)
        }

        if(this.agentRegistry.getAgentStatus('vtubestudio') === "connected") {
            this.agentRegistry.getAgent('vtubestudio').getModelId().then(currentModelId => {
                if(currentModelId) {
                    request.modelCalibration = {
                        "faceWidthMin": this.agentRegistry.getAgentFieldData(this,`${currentModelId}Min`)[0],
                        "faceHeightMin": this.agentRegistry.getAgentFieldData(this,`${currentModelId}Min`)[1],
                        "faceWidthMax": this.agentRegistry.getAgentFieldData(this,`${currentModelId}Max`)[0],
                        "faceHeightMax": this.agentRegistry.getAgentFieldData(this,`${currentModelId}Max`)[1],
                    }
                }
                this.socketClient.send(JSON.stringify(request));
            });
        }
    }

    playSound(soundIndex) {
        console.log('[OverlayAgent] Sending Sound');
        let gdh = this.agentRegistry.gameData;
        let soundData = gdh.read(`impacts`);
        let sound = soundData.find(obj => {
            return obj.location === soundIndex
        });
        if(sound === undefined ) {
            return;
        }

        let request =
            {
                "type": "sound",
                "sound": sound.location,
                "volume": sound.volume,
                "masterVolume": this.agentRegistry.appData.read('volume'),
                "appSettings": this.getAppSettings(),
                "game_data_path": gdh.read(`game_data_path`)

            }
        this.socketClient.send(JSON.stringify(request));
    }

};