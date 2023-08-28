const { io } = require("socket.io-client");
const { WebSocket } = require("ws");
const axios = require("axios");

module.exports = class CrowdControlAgent {

    constructor() {

        this.trpc = new CrowdControlTRPC(this);
        this.pubSub = new CrowdControlPubSub(this);
        this.effectQueue = {};
        this.currentGame = {};
        this.currentPack = {};
        this.agentRegistry = null;
        this.ccUID = '';
        this.token = null;
        this.tokenData = null;
        this.gameSessionId = null;
        this.gameSession = {};
        this.onGamePackLoad = () => {};
        this.agentName = 'CrowdControl';
        this.agentKey = 'crowdcontrol';
        this.agentLabel = 'Crowd Control';
        this.agentDescription = "Activate Triggers based on Crowd Control's in-game effects!";

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
                key: "selectedGamePackId",
                label: "Current Game Pack",
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
        this.log("running agentRegistered()...");
        this.agentRegistry = agentRegistry;
        if(this.agentRegistry.getAgentFieldData(this,'enabled')) {
            this.agentEnabled();
        }
    }

    agentEnabled() {
        this.log("Agent Enabled.");
        let gameId = this.agentRegistry.getAgentFieldData(this,'selectedGameId');
        let gamePackId = this.agentRegistry.getAgentFieldData(this,'selectedGamePackId');
        this.loadGameMenu(gameId, gamePackId);
        this.pubSub.createSocket();
    }

    agentDisabled() {
        if(this.pubSub.socket) {
            if (this.pubSub.socket.readyState !== WebSocket.CLOSED) {
                this.pubSub.socket.close();
            }
        }
        this.log("Agent Disabled.");
    }

    agentStatus() {
        if(!this.agentRegistry.getAgentFieldData(this,'enabled')) {
            return 'disabled';
        }
        let status = 'waiting';
        if(this.pubSub.socketConnected) {
            status = 'connected';
        }
        return status;
    }

    log(...messages) {
        console.group(`${new Date().toISOString()} [CrowdControlAgent]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

    async getEffectInputOptions() {
        this.log(this);
        let effectList = this.currentPack.effects.game;
        let effectOptions = {};
        for(const [effectId, effect] of Object.entries(effectList)) {
            let groupName = effect.hasOwnProperty('category') ? effect.category[0] : 'Ungrouped';
            if(! effectOptions.hasOwnProperty(groupName)) {
                effectOptions[groupName] = {'group': groupName, items: []};
            }
            let effectName = effect.name;
            if(typeof effect.name === "object" && effect.name.hasOwnProperty('public')) {
                effectName = effect.name.public;
            }
            effectOptions[groupName].items.push({label: effectName, value: effectId});
        }

        return Object.values(effectOptions);
    }

    getGameSession() {
        this.trpc.request('gameSession.getUsersActiveGameSession',{ccUID: this.ccUID})
            .then(response => {
                let gameSession = response.result.data.session;
                if(typeof gameSession === 'undefined') {
                    this.log('No active Game Session detected!');
                    return;
                }
                this.log(`Got Session Data!`, gameSession.gameSessionID, `${gameSession.owner.name} playing ${gameSession.gamePack.meta.name}!`);
                this.gameSessionId = gameSession.gameSessionID;
                this.gameSession = gameSession;
            })
            .catch(error => {
                this.log(`Error Getting Session Data!`, error);
            });
    }

    loadGameMenu(gameId, packId=null, callback=null) {
        axios.get("https://openapi.crowdcontrol.live/games/"+gameId+"/packs").then(response => {
            this.log('setting selected game to '+gameId + " - " + packId);
            this.currentGame = response.data;
            if(!packId) {
                packId = response.data[0].gamePackID;
            }
            this.setGamePack(gameId, packId);
            if(callback) {
                callback();
            }
        }).catch(e => {this.log(e); return null; });
    }

    onGamePackLoad() {
        this.log(`Game Pack loaded!`);
    }

    checkGameAndPack() {
        this.log("Current Game:");
        this.log(`${this.currentPack.game.gameID} - ${this.currentPack.gamePackID}` );
    }

    setGamePack(gameId, packId) {
        this.log(`Loading pack ${packId} for game ${gameId}!`);
        this.currentPack = this.currentGame.find((gamePack) => gamePack.gamePackID === packId);
        if(!this.currentPack) {
            this.log(`Cannot find ${packId} for game ${gameId}!`);
            return false;
        }
        this.checkGameAndPack();
        this.agentRegistry.setAgentFieldData(this,'selectedGameId', gameId);
        this.agentRegistry.setAgentFieldData(this,'selectedGamePackId', packId);
        this.agentRegistry.gameData.loadData(gameId, packId);
        this.onGamePackLoad();
    }

    loadTokenData() {
        this.tokenData = null;
        let token = this.agentRegistry.getAgentFieldData(this,'token');
        if(token !== '') {
            this.token = token;
            this.tokenData = JSON.parse(Buffer.from(token.split('.')[1], "base64").toString());
            this.log(`Parsed Token!`, this.tokenData);
        }
        return this.tokenData;
    }

    handleEffectRequest(payload) {

        this.log(`Inbound Effect Request [${payload.effect.effectID}] (${payload.requestID})`, payload);
        let effect = payload.effect;
        let requestID = payload.requestID;
        if (this.effectQueue.hasOwnProperty(requestID)
            || !payload.hasOwnProperty('target')
            || payload.target.ccUID !== this.ccUID) {

            return;
        }

        let newEffect = {
            payload: payload,
            last_update: "added",
            timed_effect: "false",
            eventInfo: {
                "effectId": effect.effectID
            }
        };
        if (payload.hasOwnProperty('quantity')) {
            newEffect.eventInfo.quantity = payload.quantity;
        }
        if (effect.hasOwnProperty('duration')) {
            newEffect.timed_effect = true;
            newEffect.eventInfo.duration = effect.duration * 1000;
        }

        this.effectQueue[requestID] = newEffect;
        this.log(`Registering CC Effect Request: "${requestID}"`);
    }

    handleEffectSuccess(payload) {
        this.log(`Inbound Effect Success [${payload.effect.effectID}] (${payload.requestID})`, payload.quantity);
        let effect = payload.effect;
        let requestID = payload.requestID;
        if (!this.effectQueue.hasOwnProperty(requestID)) {
            this.log(`Update for unknown effect: "${requestID}"`);
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
        this.log(`Inbound Timed Effect Update [${payload.effect.effectID}] (${payload.requestID}) : ${payload.status}, time remaining: ${parseInt(payload.timeRemaining * 1000)}ms`);
        let effect = payload.effect;
        let requestID = payload.requestID;
        if (!this.effectQueue.hasOwnProperty(requestID)) {
            this.log(`Update for unknown effect: "${requestID}"`);
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

    handleGameSessionStart(payload) {
        this.log('Detected start of a Game Session');
        this.getGameSession();
    }

    handleGameSessionStop(payload) {
        this.log('Detected end of the current Game Session');
        this.gameSessionId = null;
        this.gameSession = {};
    }

};

class CrowdControlTRPC {
    constructor(agent) {
        this.agent = agent;
    }

    log(...messages) {
        console.group(`${new Date().toISOString()} [CrowdControlAgent > CrowdControlTRPC]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

    request(method, payload) {
        return new Promise((resolve, reject) => {
            axios.get(`https://trpc.crowdcontrol.live/${method}`, {
                headers: {Authorization: `cc-auth-token ${this.agent.token}`},
                params: {input: JSON.stringify(payload)}
            }).then(response => {
                this.log('TRPC response data', response.data);
                let data = response.data;
                resolve(data);
            }).catch(error => {
                reject(error);
            });
        });
    }
}

class CrowdControlPubSub {
    constructor(agent) {
        this.agent = agent;
        this.socket = null;
        this.socketConnected = false;
        this.connectionId = '';
        this.heartbeat = null;
    }

    log(...messages) {
        console.group(`${new Date().toISOString()} [CrowdControlAgent > CrowdControlPubSub]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

    createSocket() {
        this.socket = new WebSocket("wss://pubsub.crowdcontrol.live");

        this.socket.on("message", (data) => {
            if(data.toString() === "pong") {
                this.log(`got ping response!`);
                return;
            }
            let message = JSON.parse(data);

            if(message.domain === "direct") this.handleDirectMessage(message);
            else if(message.domain === "prv") this.handlePrivateMessage(message);
            else if(message.domain === "pub") this.handlePublicMessage(message);

        });

        this.socket.on("open", () => {
            this.log("Connected to Crowd Control! Getting identity...");
            this.socket.send(JSON.stringify({action: "whoami"}));

        });

        this.socket.on("close", () => {
            this.log("Disconnected from Crowd Control! ");
            this.agent.ccUID = '';
            this.socketConnected = false;
            this.heartbeat = null;
        });

        this.socket.on("error", (error) => {
            console.error("Socket Error: " + error);
            this.heartbeat = null;
        });
    }

    beginSubscribe() {
        this.log(`Connection is ready for subscription!  Subscribing to Events Feed...`);
        this.socket.send(JSON.stringify({
            action: "subscribe",
            data: JSON.stringify({
                token: this.agent.agentRegistry.getAgentFieldData(this.agent,'token'),
                topics: ["prv/self", "pub/self"]
            })
        }));
    }

    handleSubscribeSuccess(payload) {
        this.agent.ccUID = payload.success[0].split('/')[1];
        this.log(`Subscribed! (${this.agent.ccUID})`);
        this.socketConnected = true;
        this.agent.getGameSession();
        this.heartbeat = setInterval(
            () => {this.socket.send(JSON.stringify({action: "ping"}));},
            (1000 * 60 * 9)
        );
    }

    loadTokenData() {
        this.agent.tokenData = null;
        let token = this.agent.agentRegistry.getAgentFieldData(this.agent,'token');
        if(token !== '') {
            this.agent.token = token;
            this.agent.tokenData = JSON.parse(Buffer.from(token.split('.')[1], "base64").toString());
            this.log(`Parsed Token!`, this.agent.tokenData);
        }
        return this.agent.tokenData;
    }

    handleDirectMessage(message) {
        //this.log("Incoming Direct Message",message);
        if(message.type === "subscription-result") {
            if(message.payload.success.length > 0) {
                this.handleSubscribeSuccess(message.payload);
            } else {
                this.log("Subscription failure!  Please confirm your Crowd Control Authorization is correct!");
                this.agent.agentRegistry.setAgentFieldData(this.agent,'token', '');
                this.socket.close();
                this.heartbeat = null;
            }
        } else if(message.type === "whoami") {
            this.connectionId = message.payload.connectionID;
            this.agent.agentRegistry.setAgentFieldData(this.agent,'connectionId', this.connectionId);
            this.log(`Connection ID determined: ${this.connectionId}`);
            let token = this.agent.agentRegistry.getAgentFieldData(this.agent,'token');
            if(token !== '') {
                this.loadTokenData();
                this.beginSubscribe();
            }
        } else if(message.type === "login-success") {
            this.agent.agentRegistry.setAgentFieldData(this.agent,'token', message.payload.token);
            this.log(`Successful Auth!`);
            this.loadTokenData();
            this.beginSubscribe();
        }
    }

    handlePrivateMessage(message) {
        if(message.type === "effect-request") this.agent.handleEffectRequest(message.payload);
        else if(message.type === "effect-success") this.agent.handleEffectSuccess(message.payload);
        else if(message.type === "timed-effect-update") this.agent.handleTimedEffectUpdate(message.payload);
    }

    handlePublicMessage(message) {
        if(message.type === "game-session-start") this.agent.handleGameSessionStart(message.payload);
        else if(message.type === "game-session-stop") this.agent.handleGameSessionStop(message.payload);
    }
}