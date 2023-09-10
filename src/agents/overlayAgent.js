const { WebSocket } = require("ws");
const axios = require("axios");

class OverlayAgent {

    constructor() {
        this.socketServer = null;
        this.socketClient = null;
        this.portInUse = false;
        this.calibrateStage = -2;
        this.overlayVTSConnected = false;
        this.overlayConnected = false;
        this.itemStreams = {};
        this.stacks = {itemStream: {}};
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
                default: "9090"
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
                label: "Minimum Spin Rate",
                help: "The minimum random rotational rate for thrown items",
                type: "number",
                step: "0.1",
                settable: true,
                default: "5.0"
            },
            {
                key: "spinSpeedMax",
                label: "Maximum Spin Rate",
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
                'infoRenderHandler': "handleThrowItemRender",
                'requireAgentConnection': false,
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
                        'type': 'parameter',
                        'showIfToggled': "match_quantity",
                        'default': 'quantity'
                    },
                ]
            },
            throwItemGroup: {
                'key': 'throwItemGroup',
                'label': 'Throw a Group of Items',
                'description': 'Throw an Item Group from the TuberYeets library',
                'handler': "handleThrowItemGroupOutput",
                'infoRenderHandler': "handleThrowItemGroupRender",
                'requireAgentConnection': false,
                'settings': [
                    {
                        'key': 'itemGroup',
                        'label': 'Item Group',
                        'type': 'list',
                        'optionsLoader': "getThrowItemGroupOutputOptions",
                        'default': ''
                    },
                    {
                        'key': 'match_quantity',
                        'label': 'Match Quantity to Event Parameter',
                        'type': 'toggle',
                        'default': false
                    },
                    {
                        'key': 'quantity_parameter',
                        'label': 'Event Parameter',
                        'type': 'parameter',
                        'showIfToggled': "match_quantity",
                        'default': 'quantity'
                    }
                ]
            },
            startItemStream: {
                'key': 'startItemStream',
                'label': 'Start throwing a Stream of Items',
                'description': 'Start throwing a stream of items from an Item Group from the TuberYeets library',
                'handler': "handleStartItemStreamOutput",
                'infoRenderHandler': "handleStartItemStreamRender",
                'requireAgentConnection': false,
                'settings': [
                    {
                        'key': 'itemGroup',
                        'label': 'Item Group',
                        'type': 'list',
                        'optionsLoader': "getThrowItemGroupOutputOptions",
                        'default': ''
                    },
                    {
                        'key': 'match_duration',
                        'label': 'Match Duration to Event Parameter',
                        'type': 'toggle',
                        'default': false
                    },
                    {
                        'key': 'duration',
                        'label': 'Max Duration (ms)',
                        'type': 'integer',
                        'hideIfToggled': "match_duration",
                        'default': 60000
                    },
                    {
                        'key': 'duration_parameter',
                        'label': 'Event Parameter',
                        'type': 'parameter',
                        'showIfToggled': "match_duration",
                        'default': 'duration'
                    }
                ]
            },
            stopItemStream: {
                'key': 'stopItemStream',
                'label': 'Stop throwing a Stream of Items',
                'description': 'Stop throwing a stream of items from an Item Group from the TuberYeets library',
                'handler': "handleStopItemStreamOutput",
                'infoRenderHandler': "handleStopItemStreamRender",
                'requireAgentConnection': false,
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
                'infoRenderHandler': "handlePlaySoundRender",
                'requireAgentConnection': false,
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
            fireGetWebhook: {
                'key': 'fireGetWebhook',
                'label': 'Fire a GET Webhook',
                'description': 'send a HTTP GET Request',
                'handler': "handleFireGetWebhookOutput",
                'infoRenderHandler': "handleFireGetWebhookRender",
                'requireAgentConnection': false,
                'settings': [

                    {
                        'key': 'description',
                        'label': 'Webhook Description',
                        'type': 'text',
                        'default': 'My New Webhook'
                    },
                    {
                        'key': 'url',
                        'label': 'Webhook URL',
                        'type': 'text',
                        'default': ''
                    },
                ]
            },
            firePostWebhook: {
                'key': 'firePostWebhook',
                'label': 'Fire a POST Webhook',
                'description': 'send a HTTP POST Request',
                'handler': "handleFirePostWebhookOutput",
                'infoRenderHandler': "handleFirePostWebhookRender",
                'requireAgentConnection': false,
                'settings': [

                    {
                        'key': 'description',
                        'label': 'Webhook Description',
                        'type': 'text',
                        'default': 'My New Webhook'
                    },
                    {
                        'key': 'url',
                        'label': 'Webhook URL',
                        'type': 'text',
                        'default': ''
                    },
                    {
                        'key': 'auto_payload',
                        'label': 'Send Event Parameters as payload',
                        'type': 'toggle',
                        'default': true
                    },
                    {
                        'key': 'json',
                        'label': 'JSON Payload',
                        'type': 'textarea',
                        'hideIfToggled': 'auto_payload',
                        'default': ''
                    },
                ]
            },
        };

    }

    agentRegistered(agentRegistry) {
        this.log("running agentRegistered()...");
        this.agentRegistry = agentRegistry;
        if(this.agentRegistry.getAgentFieldData(this,'enabled')) {
            this.agentEnabled();
        }
    }

    agentEnabled() {
        this.log("Agent Enabled.");
        this.createServer();
    }

    agentDisabled() {
        this.log("Agent Disabled.");
        this.closeServer();
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

    log(...messages) {
        console.group(`${new Date().toISOString()} [OverlayAgent]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

    async getThrowItemOutputOptions() {
        let item_list = this.agentRegistry.gameData.read(`items`);
        let item_options = [];
        for (const [key, item] of Object.entries(item_list)) {
            item_options.push({'label': item.name, 'value': key});
        }
        return item_options;
    }

    handleThrowItemOutput(values) {
        let throwDelay = this.agentRegistry.getAgentFieldData(this,'groupFrequency');
        let throwCount = parseInt(values.quantity);
        if(values.match_quantity && values.quantity_parameter) {
            if(values.__trigger.parameters.hasOwnProperty(values.quantity_parameter)) {
                this.log(values.__trigger.parameters[values.quantity_parameter]);
                throwCount = parseInt(values.__trigger.parameters[values.quantity_parameter]);
            } else {
                this.log(`quantity_parameter not found`, values);
            }
        }
        this.throwItems(values.item, throwCount);
    }

    handleThrowItemRender(settings) {
        let itemName = '[Unknown]';
        let item = this.agentRegistry.gameData.read(`items.${settings.item}`);
        if (item && item.hasOwnProperty('name')) {
            itemName = item.name;
        }

        let quantityDescription = `Manual - ${settings.quantity}`;
        if(settings.match_quantity) {
            quantityDescription = `Match Event Parameter - ${settings.quantity_parameter}`;
        }

        return `<ul>` +
            `<li><strong>Item: </strong><span>${itemName}</span></li>` +
            `<li><strong>Quantity: </strong><span>${quantityDescription}</span></li>` +
            `</ul>`;
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
        this.log(`item group debug`, values);
        let throwCount = parseInt(values.quantity);
        if(values.match_quantity && values.quantity_parameter) {
            if(values.__trigger.parameters.hasOwnProperty(values.quantity_parameter)) {
                throwCount = parseInt(values.__trigger.parameters[values.quantity_parameter]);
                this.throwItemGroup(values.itemGroup, throwCount);
                return;
            } else {
                this.log(`quantity_parameter not found`, values);
            }
        }
        this.throwItemGroup(values.itemGroup);
    }

    handleThrowItemGroupRender(settings) {
        let itemGroupName = '[Unknown]';
        let itemGroup = this.agentRegistry.gameData.read(`itemGroups.${settings.itemGroup}`);
        if (itemGroup && itemGroup.hasOwnProperty('name')) {
            itemGroupName = itemGroup.name;
        }

        let quantityDescription = 'Use Item Group Settings';
        if(settings.match_quantity) {
            quantityDescription = `Match Event Parameter - ${settings.quantity_parameter}`;
        }

        return `<ul>` +
                `<li><strong>Item Group: </strong><span>${itemGroupName}</span></li>` +
                `<li><strong>Quantity: </strong><span>${quantityDescription}</span></li>` +
               `</ul>`;
    }

    handleStartItemStreamOutput(values) {
        let throwDuration = parseInt(values.duration);
        if(values.match_duration && values.duration_parameter) {
            if(values.__trigger.parameters.hasOwnProperty(values.duration_parameter)) {
                throwDuration = parseInt(values.__trigger.parameters[values.duration_parameter]);
                this.startItemStream(values.itemGroup, throwDuration);
                return;
            } else {
                this.log(`duration_parameter not found`, values);
            }
        }
        this.startItemStream(values.itemGroup);
    }

    handleStartItemStreamRender(settings) {
        let itemGroupName = '[Unknown]';
        let itemGroup = this.agentRegistry.gameData.read(`itemGroups.${settings.itemGroup}`);
        if (itemGroup && itemGroup.hasOwnProperty('name')) {
            itemGroupName = itemGroup.name;
        }

        let durationDescription = `Manual - ${settings.duration}ms`;
        if(settings.match_duration) {
            durationDescription = `Match Event Parameter - ${settings.duration_parameter}`;
        }

        return `<ul>` +
            `<li><strong>Item Group: </strong><span>${itemGroupName}</span></li>` +
            `<li><strong>Max Duration: </strong><span>${durationDescription}</span></li>` +
            `</ul>`;
    }

    handleStopItemStreamOutput(values) {
        this.stopItemStream(values.itemGroup);
    }

    handleStopItemStreamRender(settings) {
        let itemGroupName = '[Unknown]';
        let itemGroup = this.agentRegistry.gameData.read(`itemGroups.${settings.itemGroup}`);
        if (itemGroup && itemGroup.hasOwnProperty('name')) {
            itemGroupName = itemGroup.name;
        }

        return `<ul>` +
            `<li><strong>Item Group: </strong><span>${itemGroupName}</span></li>` +
            `</ul>`;
    }

    handleFireGetWebhookOutput(values) {
        this.log(`Firing webhook "${values.description}"`);
        axios.get(values.url).then(response => {
            this.log(`Successfully fired webhook "${values.description}"`, response);
        }).catch(e => {
            this.log(`Error firing webhook "${values.description}"`, e);
        });
    }

    handleFireGetWebhookRender(settings) {

        return `<ul>` +
            `<li><strong>Description: </strong><span>${settings.description}</span></li>` +
            `<li><strong>URL: </strong><span><em>(hidden for security purposes)</em></span></li>` +
            `</ul>`;
    }

    handleFirePostWebhookOutput(values) {
        this.log(`Firing webhook "${values.description}"`);
        let payload = values.json;
        if(values.auto_payload) {
            payload = JSON.stringify(values);
        }
        this.log(`post hook payload`, payload);
        axios.post(values.url, payload, {headers: {"content-type": "application/json"}}).then(response => {
            this.log(`Successfully fired webhook "${values.description}"`, response);
        }).catch(e => {
            this.log(`Error firing webhook "${values.description}"`, e);
        });
    }

    handleFirePostWebhookRender(settings) {

        return `<ul>` +
            `<li><strong>Description: </strong><span>${settings.description}</span></li>` +
            `<li><strong>URL: </strong><span><em>(hidden for security purposes)</em></span></li>` +
            `</ul>`;
    }

    async getPlaySoundOutputOptions() {
        let sound_list = this.agentRegistry.gameData.read('sounds');
        let sound_options = [];
        for (const [key, sound] of Object.entries(sound_list)) {
            sound_options.push({'label': sound.location, 'value': key});
        }
        return sound_options;
    }

    handlePlaySoundOutput(values) {
        this.playSound(values.sound);
    }

    handlePlaySoundRender(settings) {
        let soundName = '[Unknown]';
        let sound = this.agentRegistry.gameData.read(`sounds.${settings.sound}`);
        if (sound && sound.hasOwnProperty('location')) {
            soundName = sound.location;
        }

        return `<ul>` +
            `<li><strong>Sound: </strong><span>${soundName}</span></li>` +
            `</ul>`;
    }

    createServer() {
        this.closeServer();
        let targetPort = this.agentRegistry.getAgentFieldData(this,'port');
        this.socketServer = new WebSocket.Server({ port: targetPort });
        this.socketServer.on("error", (err) => { this.socketServerHandleError(err) } );
        this.socketServer.on("close", (err) => { this.socketServerHandleClose() } );
        if(this.portInUse) { return; }
        this.log("Socket Server Started on port "+targetPort+"!");
        this.socketServer.on("connection", (ws) => { this.socketServerHandleConnection(ws) });
    }

    closeServer() {
        if(this.socketServer) {
            if (this.socketServer.readyState !== WebSocket.CLOSED) {
                this.socketServer.close();
                this.portInUse = false;
            }
        }
    }

    socketServerHandleError(err) {
        this.portInUse = true;
        this.log("[Overlay Agent] Socket Error: ", err)
        this.closeServer();
        // Retry server creation after 3 seconds
        setTimeout(() => {
            this.createServer()
        }, 3000);
    }

    socketServerHandleClose() {
        this.log("Socket Server Closed!");
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
        this.log("Socket Client Disconnected!");
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
            this.log('[Overlay] Calibration Status updated',request);
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

    incrementStack(type, name) {
        if(!this.stacks.hasOwnProperty(type)) return false;
        if(!this.stacks[type].hasOwnProperty(name)) {
            this.stacks[type][name] = 1;
            return 1;
        }
        this.stacks[type][name] ++;
        return this.stacks[type][name];
    }

    decrementStack(type, name) {
        if(!this.stacks.hasOwnProperty(type)) return false;
        if(!this.stacks[type].hasOwnProperty(name)) return false;
        if(this.stacks[type][name] === 1) {
            delete this.stacks[type][name];
            return 0;
        }
        this.stacks[type][name] --;
        return this.stacks[type][name];
    }

    checkStack(type, name) {
        if(!this.stacks.hasOwnProperty(type)) return false;
        if(!this.stacks[type].hasOwnProperty(name)) return 0;
        return this.stacks[type][name];

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
        this.log('Starting VTS Calibration');
        this.calibrateStage = -1;
        this.proceedCalibration();
    }

    nextCalibration() {
        this.log('Continuing VTS Calibration');
        this.calibrateStage ++;
        this.proceedCalibration();
    }

    cancelCalibration() {
        this.log('Cancelling VTS Calibration');
        this.calibrateStage = 4;
        this.proceedCalibration();
    }

    getCalibrateStage() {
        return this.calibrateStage;
    }

    throwItem(itemId) {
        this.log(`Sending Custom Item ${itemId}`);
        let gdh = this.agentRegistry.gameData;

        let itemDetails = gdh.itemGroupEventHelper.getItemById(itemId);
        if(itemDetails === null) {
            this.log('Failed to Send Single Item:  Item could not be generated!');
            return;
        }

        this.sendWithTargeting({
            "item": itemDetails,
            "type": "single",
            "masterVolume": Number(this.agentRegistry.getAgentFieldData(this,'volume')),
            "appSettings": this.getAppSettings(),
            "game_data_path": gdh.read(`game_data_path`)
        });
    }

    sendWithTargeting(request) {
        if(this.agentRegistry.getAgentStatus('vtubestudio') === "connected") {
            this.agentRegistry.getAgent('vtubestudio').getModelId().then(currentModelId => {
                this.log('current model:',currentModelId);
                if(currentModelId) {
                    this.log('current model:',currentModelId);
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

    throwItems(itemId,customCount=1) {
        this.log(`Sending ${customCount} Items`);
        let gdh = this.agentRegistry.gameData;
        let itemsForGroup = [];
        for (let i = 0; i < customCount; i++) {
            this.log(`Pushing ${itemId}`);
            itemsForGroup.push(gdh.itemGroupEventHelper.getItemById(itemId));
        }

        this.sendWithTargeting({
            "items": itemsForGroup,
            "type": 'group',
            "masterVolume": this.agentRegistry.appData.read('volume'),
            "windupSound": null,
            "appSettings": this.getAppSettings(),
            "game_data_path": gdh.read(`game_data_path`)
        });
    }

    throwItemGroup(itemGroupId,customCount=null) {
        this.log('Sending Item Group');
        let gdh = this.agentRegistry.gameData;
        let data= {
            "items": gdh.itemGroupEventHelper.getItemsForGroup(itemGroupId,customCount),
            "type": itemGroupId,
            "masterVolume": this.agentRegistry.appData.read('volume'),
            "windupSound": null,
            "appSettings": this.getAppSettings(),
            "itemGroup": gdh.read(`itemGroups.${itemGroupId}`),
            "game_data_path": gdh.read(`game_data_path`)
        };
        console.log(data)
        this.sendWithTargeting(data);
    }

    startItemStream(itemGroupId, customDuration=null) {
        this.log("overlay stacks",this.stacks);
        if(this.incrementStack('itemStream', itemGroupId) === 1) {
            this.log(`Starting Item Stream for ${itemGroupId}`);
            this.itemStreams[itemGroupId] = new OverlayItemStream(itemGroupId,this,itemGroupId, customDuration);
        }
    }

    stopItemStream(itemGroupId) {
        if(this.decrementStack('itemStream', itemGroupId) === 0) {
            this.log(`Stopping Item Stream for ${itemGroupId}`);
            if (this.itemStreams.hasOwnProperty(itemGroupId) && this.itemStreams[itemGroupId] !== null) {
                try {
                    this.itemStreams[itemGroupId].stop();
                } catch (e) {
                    //this is fine, another item probably removed it
                }
            }
        }
    }

    playSound(soundIndex) {
        this.log('Sending Sound to Overlay');

        let gdh = this.agentRegistry.gameData;
        let sound = this.agentRegistry.gameData.read(`sounds.${soundIndex}`);
        if (!sound || !sound.hasOwnProperty('location')) {
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

}
class OverlayItem {

}
class OverlaySound {

}
class OverlayItemGroup {

}
class OverlayItemStream {
    constructor(refId, overlayAgent, itemGroupId, duration = null) {
        this.refId = refId
        this.overlayAgent = overlayAgent;
        this.durationRemaining = duration ? duration : 60000;
        this.itemGroupId = itemGroupId;

        this.itemTimer = null;
        this.itemBuffer = this.overlayAgent.agentRegistry.gameData.itemGroupEventHelper.getItemsForGroup(itemGroupId,100);
        this.itemBufferIndex = 0;
        this.itemGroup = this.overlayAgent.agentRegistry.gameData.read(`itemGroups.${itemGroupId}`);
        this.appSettings = this.overlayAgent.getAppSettings();
        this.start();
    }

    start() {
        this.overlayAgent.log("Starting Item Stream");
        if(this.itemBuffer.length > 0) {
            this.throw();
        }
    }

    stop() {
        this.overlayAgent.log("Stopping Item Stream");
        if(this.itemBuffer.length > 0) {
            clearTimeout(this.itemTimer);
            this.overlayAgent.itemStreams[this.refId] = null;
        }
    }

    throw() {

        this.itemBufferIndex += 1;
        if(this.itemBufferIndex >= this.itemBuffer.length) {
            this.itemBufferIndex = 0;
        }

        let throwDelay = this.appSettings.groupFrequency * 1000;
        if(this.itemGroup.groupFrequencyOverride === true) {
            throwDelay = this.itemGroup.groupFrequency * 1000;
        }
        let tickRate = throwDelay + (Math.floor((Math.random() * throwDelay * 1.5) - (throwDelay * 0.75)));

        this.overlayAgent.sendWithTargeting({
            "item": this.itemBuffer[this.itemBufferIndex],
            "type": "single",
            "masterVolume": this.overlayAgent.agentRegistry.appData.read('volume'),
            "appSettings": this.appSettings,
            "game_data_path": this.overlayAgent.agentRegistry.gameData.read(`game_data_path`)
        });

        this.overlayAgent.log(`Duration Remaining: ${this.durationRemaining}, Bonk Delay: ${tickRate}`);
        this.durationRemaining -= tickRate;
        if(this.durationRemaining > 0) {
            this.itemTimer = setTimeout(() => {this.throw();},tickRate);
        } else {
            this.stop();
        }
    }
}
module.exports = OverlayAgent;