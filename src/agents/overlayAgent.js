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
        this.agentKey = 'overlay';
        this.agentLabel = 'Overlay';
        this.agentSettings = [
            {"name": "enabled", "default": false},
            {"name": "port", "default": 8081},
            {"name": "vtsOverlayAuthKey", "default": ""}
        ];
        this.agentInputs = {};
        this.agentOutputs = {
            throwItem: {
                'key': 'throwItem',
                'label': 'Throw an Item',
                'description': 'Throw an item from the TuberYeets library',
                'handler': (values) => { this.handleThrowItemOutput(values) },
                'settings': [
                    {
                        'key': 'item',
                        'label': 'Item',
                        'type': 'list',
                        'options': () => {this.getThrowItemOutputOptions()},
                        'default': ''
                    }
                ]
            },
            throwBonk: {
                'key': 'throwBonk',
                'label': 'Throw a Bonk',
                'description': 'Throw a custom bonk from the TuberYeets library',
                'handler': (values) => { this.handleThrowBonkOutput(values) },
                'settings': [
                    {
                        'key': 'bonk',
                        'label': 'Bonk',
                        'type': 'list',
                        'options': () => {this.getThrowBonkOutputOptions()},
                        'default': ''
                    }
                ]
            },
            playSound: {
                'key': 'playSound',
                'label': 'Play a Sound',
                'description': 'Play a Sound from the TuberYeets library',
                'handler': (values) => { this.handlePlaySoundOutput(values) },
                'settings': [
                    {
                        'key': 'sound',
                        'label': 'Sound',
                        'type': 'list',
                        'options': () => {this.getPlaySoundOutputOptions()},
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
        if(this.socketClient) {
            this.socketClient = null;
        }
        if(this.socketServer) {
            this.socketServer = null;
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

    getThrowItemOutputOptions() {
        let item_list = this.agentRegistry.gameData.throws
        let item_options = [];
        item_list.forEach((item) => {
            item_options.push({'label': item.location, 'value': item.location});
        });
        return item_options;
    }

    handleThrowItemOutput(values) {
        this.throwItem(values.item);
    }

    getThrowBonkOutputOptions() {
        let bonk_list = this.agentRegistry.gameData.customBonks;
        let bonk_options = [];
        for (const [key, bonk] of Object.entries(bonk_list)) {
            bonk_options.push({'label': bonk.name, 'value': key});
        }
        return bonk_options;
    }

    handleThrowBonkOutput(values) {
        this.throwBonk(values.bonk);
    }

    getPlaySoundOutputOptions() {
        let sound_list = this.agentRegistry.gameData.impacts
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
        if(this.portInUse) { return; }
        console.log("[OverlayAgent] Socket Server Started on port "+targetPort+"!");
        this.socketServer.on("connection", (ws) => { this.socketServerHandleConnection(ws) });
    }

    socketServerHandleError(err) {
        this.portInUse = true;
        // Retry server creation after 3 seconds
        setTimeout(() => {
            this.createServer()
        }, 3000);
    }

    socketServerHandleConnection(ws) {
        this.portInUse = false;
        this.socketClient = ws;
        this.overlayConnected = true;
        this.socketClient.on("message", (request) => { this.socketClientHandleMessage(request) });
        this.socketClient.on("close", () => {this.socketClientHandleClose() });

    }

    socketClientHandleClose() {
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
            this.overlayVTSConnected = request.connectedBonkerVTube;
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
        let appData = this.agentRegistry.appData;
        return {
            barrageCount: appData.read('barrageCount'),
            barrageFrequency: appData.read('barrageFrequency'),
            throwAngleMin: appData.read('throwAngleMin'),
            throwAngleMax: appData.read('throwAngleMax'),
            itemScaleMin: appData.read('itemScaleMin'),
            itemScaleMax: appData.read('itemScaleMax'),
            throwDuration: appData.read('throwDuration'),
            delay: appData.read('delay'),
            spinSpeedMin: appData.read('spinSpeedMin'),
            spinSpeedMax: appData.read('spinSpeedMax'),
            volume: appData.read('volume'),
            closeEyes: appData.read('closeEyes'),
            openEyes: appData.read('openEyes'),
            returnSpeed: appData.read('returnSpeed'),
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

    throwItem(itemIndex) {
        console.log('[OverlayAgent] Sending Custom Item');
        let gdh = this.agentRegistry.gameData;

        let itemData = gdh.read(`throws`);
        let item = itemData.find(obj => {
            return obj.location === itemIndex
        });
        if(item === undefined ) {
            return;
        }

        let soundIndex = -1;
        if (gdh.hasActiveSound())
        {
            do {
                soundIndex = Math.floor(Math.random() * gdh.read(`impacts`).length);
            } while (!gdh.read(`impacts.${soundIndex}.enabled`));
        }

        let request =
            {
                "type": "single",
                "image": item.location,
                "weight": item.weight,
                "scale": item.scale,
                "sound": item.sound == null && soundIndex != -1 ? gdh.read(`impacts.${soundIndex}.location`) : item.sound,
                "volume": item.volume,
                "masterVolume": this.agentRegistry.appData.read('volume'),
                "appSettings": this.getAppSettings(),
                "game_data_path": gdh.read(`game_data_path`)

            }
        if(this.agentRegistry.getAgentStatus('vtubestudio') === "connected") {
            let currentModelId = this.agentRegistry.getAgent('vtubestudio').getModelId();
            if(currentModelId) {
                request.modelCalibration = {
                    "faceWidthMin": this.agentRegistry.appData.read(`${currentModelId}Min`)[0],
                    "faceHeightMin": this.agentRegistry.appData.read(`${currentModelId}Min`)[1],
                    "faceWidthMax": this.agentRegistry.appData.read(`${currentModelId}Max`)[0],
                    "faceHeightMax": this.agentRegistry.appData.read(`${currentModelId}Max`)[1],
                }
            }
        }
        this.socketClient.send(JSON.stringify(request));
    }

    throwBonk(bonkName,customCount=null) {
        console.log('[OverlayAgent] Sending Custom Bonk');
        let gdh = this.agentRegistry.gameData;
        const imagesWeightsScalesSoundsVolumes = gdh.bonkEventHelper.getCustomImagesWeightsScalesSoundsVolumes(bonkName,customCount);
        let images = [], weights = [], scales = [], sounds = [], volumes = [], impactDecals = [], windupSounds = [];
        for (let i = 0; i < imagesWeightsScalesSoundsVolumes.length; i++) {
            images[i] = imagesWeightsScalesSoundsVolumes[i].location;
            weights[i] = imagesWeightsScalesSoundsVolumes[i].weight;
            scales[i] = imagesWeightsScalesSoundsVolumes[i].scale;
            sounds[i] = imagesWeightsScalesSoundsVolumes[i].sound;
            volumes[i] = imagesWeightsScalesSoundsVolumes[i].volume;
            impactDecals[i] = imagesWeightsScalesSoundsVolumes[i].impactDecal;
            windupSounds[i] = imagesWeightsScalesSoundsVolumes[i].windupSound;
        }

        let request = {
            "type": bonkName,
            "image": images,
            "weight": weights,
            "scale": scales,
            "sound": sounds,
            "volume": volumes,
            "masterVolume": this.agentRegistry.appData.read('volume'),
            "impactDecal": impactDecals,
            "windupSound": windupSounds,
            "appSettings": this.getAppSettings(),
            "customBonk": gdh.read(`customBonks.${bonkName}`),
            "game_data_path": gdh.read(`game_data_path`)
        }

        if(this.agentRegistry.getAgentStatus('vtubestudio') === "connected") {
            let currentModelId = this.agentRegistry.getAgent('vtubestudio').getModelId();
            if(currentModelId) {
                request.modelCalibration = {
                    "faceWidthMin": this.agentRegistry.appData.read(`${currentModelId}Min`)[0] || 0,
                    "faceHeightMin": this.agentRegistry.appData.read(`${currentModelId}Min`)[1] || 0,
                    "faceWidthMax": this.agentRegistry.appData.read(`${currentModelId}Max`)[0] || 0,
                    "faceHeightMax": this.agentRegistry.appData.read(`${currentModelId}Max`)[1] || 0,
                }
            }
        }
        this.socketClient.send(JSON.stringify(request));
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