const { io } = require("socket.io-client");
const { WebSocket } = require("ws");
const axios = require("axios");

module.exports = class CrowdControlAgent {

    constructor() {
        this.socket = null;
        this.socketConnected = false;
        this.connectionId = '';
        this.effectQueue = {};
        this.currentGame = {};
        this.currentPack = {};
        this.agentRegistry = null;
        this.ccuid = '';
        this.tokenData = null;
        this.onGamePackLoad = () => {};
        this.agentName = 'CrowdControl';
        this.agentKey = 'crowdcontrol';
        this.agentLabel = 'Crowd Control';
        this.agentDescription = "Activate Triggers based on Crowd Control's in-game effects!";
        this.heartbeat = null;
        this.agentSettingsForm = 'CrowdControlSettings';
        this.agentSettings = [
            {
                key: "enabled",
                label: "Enabled",
                type: "toggle",
                settable: false,
                default: true
            },
            {
                key: "token",
                label: "Token",
                type: "text",
                settable: false,
                default: ''
            },
            {
                key: "connectionId",
                label: "Connection ID",
                type: "text",
                settable: false,
                default: ''
            },
            {
                key: "selectedGameId",
                label: "Current Game",
                type: "text",
                settable: false,
                default: "SuperMario64"
            },
            {
                key: "Current Game Pack",
                label: "",
                type: "text",
                settable: false,
                default: "SuperMario64"
            }
        ];
        this.agentInputs = {
            effect: {
                'key': 'effect',
                'label': 'In-Game Effect',
                'description': 'A game effect is sent from Crowd Control',
                'settings': [
                    {
                        'key': 'effectId',
                        'label': 'Effect',
                        'type': 'groupedList',
                        'optionsLoader': 'getEffectInputOptions',
                        'settable': true
                    },
                    {
                        'key': 'quantity',
                        'label': 'Quantity',
                        'type': 'number',
                        'step': '1',
                        'default': 1,
                        'settable': false
                    },
                    {
                        'key': 'duration',
                        'label': 'Duration',
                        'type': 'number',
                        'step': '1',
                        'default': 0,
                        'settable': false
                    }
                ],
                'triggerScripts' : [
                    'completed', 'begin', 'pause', 'resume', 'end'
                ]
            }
        };
        this.agentOutputs = {
        };

    }

    agentRegistered(agentRegistry) {
        console.log("[CrowdControlAgent] running agentRegistered()...");
        this.agentRegistry = agentRegistry;
        if(this.agentRegistry.getAgentFieldData(this,'enabled')) {
            this.agentEnabled();
        }
    }

    agentEnabled() {
        console.log("[CrowdControlAgent] Agent Enabled.");
        let gameId = this.agentRegistry.getAgentFieldData(this,'selectedGameId');
        let gamePackId = this.agentRegistry.getAgentFieldData(this,'selectedGamePackId');
        this.loadGameMenu(gameId, gamePackId);
        this.createSocket();
    }

    agentDisabled() {
        if(this.socket) {
            if (this.socket.readyState !== WebSocket.CLOSED) {
                this.socket.close();
            }
        }
        console.log("[CrowdControlAgent] Agent Disabled.");
    }

    agentStatus() {
        if(!this.agentRegistry.getAgentFieldData(this,'enabled')) {
            return 'disabled';
        }
        let status = 'waiting';
        if(this.socketConnected) {
            status = 'connected';
        }
        return status;
    }

    async getEffectInputOptions() {
        console.log(this);
        let effectList = this.currentPack.effects.game;
        let effectOptions = {};
        for(const [effectId, effect] of Object.entries(effectList)) {
            let groupName = effect.hasOwnProperty('category') ? effect.category[0] : 'Ungrouped';
            if(! effectOptions.hasOwnProperty(groupName)) {
                effectOptions[groupName] = {'group': groupName, items: []};
            }
            effectOptions[groupName].items.push({label: effect.name, value: effectId});
        }

        return Object.values(effectOptions);
    }

    loadGameMenu(gameId, packId=null, callback=null) {
        axios.get("https://openapi.crowdcontrol.live/games/"+gameId+"/packs").then(response => {
            console.log('[CrowdControlAgent] setting selected game to '+gameId + " - " + packId);
            this.currentGame = response.data;
            if(!packId) {
                packId = response.data[0].gamePackID;
            }
            this.setGamePack(gameId, packId);
            if(callback) {
                callback();
            }
        }).catch(e => {console.log(e); return null; });
    }

    onGamePackLoad() {
        console.log(`[CrowdControlAgent] Game Pack loaded!`);
    }

    checkGameAndPack() {
        console.log("Current Game:");
        console.log(`${this.currentPack.game.gameID} - ${this.currentPack.gamePackID}` );
    }

    setGamePack(gameId, packId) {
        console.log(`[CrowdControlAgent] Loading pack ${packId} for game ${gameId}!`);
        this.currentPack = this.currentGame.find((gamePack) => gamePack.gamePackID === packId);
        if(!this.currentPack) {
            console.log(`[CrowdControlAgent] Cannot find ${packId} for game ${gameId}!`);
            return false;
        }
        this.checkGameAndPack();
        this.agentRegistry.setAgentFieldData(this,'selectedGameId', gameId);
        this.agentRegistry.setAgentFieldData(this,'selectedGamePackId', packId);
        this.agentRegistry.gameData.loadData(gameId, packId);
        this.onGamePackLoad();
    }

    createSocket() {
        this.socket = new WebSocket("wss://pubsub.crowdcontrol.live");

        this.socket.on("message", (data) => {
            if(data.toString() === "pong") {
                console.log(`[CrowdControlAgent] got ping response!`);
                return;
            }
            let message = JSON.parse(data);

            if(message.domain === "direct") this.handleDirectMessage(message);
            else if(message.domain === "prv") this.handlePrivateMessage(message);
            else if(message.domain === "pub") this.handlePublicMessage(message);

        });

        this.socket.on("open", () => {
            console.log("[CrowdControlAgent] Connected to Crowd Control! Getting identity...");
            this.socket.send(JSON.stringify({action: "whoami"}));

        });

        this.socket.on("close", () => {
            console.log("[CrowdControlAgent] Disconnected from Crowd Control! ");
            this.ccuid = '';
            this.socketConnected = false;
            this.heartbeat = null;
        });

        this.socket.on("error", (error) => {
            console.error("[CrowdControlAgent] Socket Error: " + error);
            this.heartbeat = null;
        });
    }

    onConnectionReady() {
        console.log(`[CrowdControlAgent] Connection ready for auth!`);
    }

    beginSubscribe() {
        console.log(`[CrowdControlAgent] Connection is ready for subscription!  Subscribing to Events Feed...`);
        this.socket.send(JSON.stringify({
            action: "subscribe",
            data: JSON.stringify({
                token: this.agentRegistry.getAgentFieldData(this,'token'),
                topics: ["prv/self"]
            })
        }));
    }

    handleSubscribeSuccess(payload) {
        this.ccuid = payload.success[0].split('/')[1];
        console.log(`[CrowdControlAgent] Subscribed! (${this.ccuid})`);
        this.socketConnected = true;
        this.heartbeat = setInterval(
            () => {this.socket.send(JSON.stringify({action: "ping"}));},
            (1000 * 60 * 9)
        );
    }

    handleDirectMessage(message) {
        console.log("[CrowdControlAgent] Incoming Direct Message",message);
        if(message.type === "subscription-result") {
            if(message.payload.success.length > 0) {
                this.handleSubscribeSuccess(message.payload);
            } else {
                console.log("[CrowdControlAgent] Subscription failure!  Please confirm your Crowd Control Authorization is correct!");
                this.agentRegistry.setAgentFieldData(this,'token', '');
                this.socket.close();
                this.heartbeat = null;
            }
        } else if(message.type === "whoami") {
            this.connectionId = message.payload.connectionID;
            this.agentRegistry.setAgentFieldData(this,'connectionId', this.connectionId);
            console.log(`[CrowdControlAgent] Connection ID determined: ${this.connectionId}`);
            let token = this.agentRegistry.getAgentFieldData(this,'token');
            if(token !== '') {
                this.loadTokenData();
                this.beginSubscribe();
            }
        } else if(message.type === "login-success") {
            this.agentRegistry.setAgentFieldData(this,'token', message.payload.token);
            console.log(`[CrowdControlAgent] Successful Auth!`);
            this.loadTokenData();
            this.beginSubscribe();
        }
    }

    loadTokenData() {
        this.tokenData = null;
        let token = this.agentRegistry.getAgentFieldData(this,'token');
        if(token !== '') {
            this.tokenData = JSON.parse(Buffer.from(token.split('.')[1], "base64").toString());
            console.log(`[CrowdControlAgent] Parsed Token!`, this.tokenData);
        }
        return this.tokenData;
    }

    handlePrivateMessage(message) {
        if(message.type === "effect-request") this.handleEffectRequest(message.payload);
        else if(message.type === "effect-success") this.handleEffectSuccess(message.payload);
        else if(message.type === "timed-effect-update") this.handleTimedEffectUpdate(message.payload);
    }

    handlePublicMessage(message) {
        console.log("[CrowdControlAgent] Incoming Public Message",message);
    }

    handleEffectRequest(payload) {
//Initial event feed.  We use this to add a new entity to the list
        console.log(`[CrowdControlAgent] Incoming Effect Request [${payload.effect.effectID}] (${payload.requestID})`, payload.quantity);
        let effect = payload.effect;
        let requestID = payload.requestID;
        if (!this.effectQueue.hasOwnProperty(requestID) && payload.hasOwnProperty('target') && payload.target.ccUID === this.ccuid) {
            let newEffect = {
                payload: payload,
                last_update: "added",
                timed_effect: "false",
                eventInfo: {
                    "effectId": effect.effectID
                }
            };
            if (payload.hasOwnProperty('quantity')) {
                newEffect.eventInfo.quantity = effect.quantity;
            }
            if (effect.hasOwnProperty('duration')) {
                newEffect.timed_effect = true;
                newEffect.eventInfo.duration = effect.duration;
            }

            this.effectQueue[requestID] = newEffect;
            console.log(`[CrowdControlAgent] Registering CC Effect Request: "${requestID}"`);
        }

    }

    handleEffectSuccess(payload) {
        console.log(`[CrowdControlAgent] Incoming Effect Success [${payload.effect.effectID}] (${payload.requestID})`, payload.quantity);
        let effect = payload.effect;
        let requestID = payload.requestID;
        if (!this.effectQueue.hasOwnProperty(requestID)) {
            console.log(`[CrowdControlAgent] Update for unknown effect: "${requestID}"`);
            return;
        }
        this.effectQueue[requestID].last_update = "completed";
        if(this.effectQueue[requestID].timed_effect === true) {
            return;
        }
        this.agentRegistry.eventManager.handleInputTrigger(this.agentKey, "effect","completed", this.effectQueue[requestID].eventInfo);
        delete this.effectQueue[requestID];
    }

    handleTimedEffectUpdate(payload) {
        console.log(`[CrowdControlAgent] Incoming Timed Effect Update [${payload.effect.effectID}] (${payload.requestID}) : ${payload.status}, time remaining: ${parseInt(payload.timeRemaining * 1000)}ms`);
        let effect = payload.effect;
        let requestID = payload.requestID;
        if (!this.effectQueue.hasOwnProperty(requestID)) {
            console.log(`[CrowdControlAgent] Update for unknown effect: "${requestID}"`);
            return;
        }
        this.effectQueue[requestID].last_update = payload.status;
        if(!this.effectQueue[requestID].timed_effect === true) {
            return;
        }
        this.agentRegistry.eventManager.handleInputTrigger(this.agentKey, "effect",payload.status, this.effectQueue[requestID].eventInfo);
        if(payload.status === "end") {
            delete this.effectQueue[requestID];
        }
    }

};