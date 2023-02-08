const { io } = require("socket.io-client");
const axios = require("axios");

module.exports = class CrowdControlAgent {

    constructor() {
        this.socket = null;
        this.socketConnected = false;
        this.effectQueue = {};
        this.currentGame = {};
        this.agentRegistry = null;
        this.agentName = 'CrowdControl';
        this.agentKey = 'crowdcontrol';
        this.agentLabel = 'Crowd Control';
        this.agentSettings = [
            {"name": "enabled", "default": false},
            {"name": "channelName", "default": ""},
            {"name": "selectedGameId", "default": 9}
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
                        'options': () => { this.getEffectInputOptions },
                        'settable': true
                    },
                    {
                        'key': 'quantity',
                        'label': 'Quantity',
                        'type': 'integer',
                        'default': 1,
                        'settable': false
                    },
                    {
                        'key': 'duration',
                        'label': 'Duration',
                        'type': 'integer',
                        'default': 0,
                        'settable': false
                    }
                ],
                'eventScripts' : [
                    'completed', 'start', 'pause', 'resume', 'stop'
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
        this.loadGameMenu(gameId);
        this.createSocket();
    }

    agentDisabled() {
        if(this.socket) {
            this.socket = null;
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

    getEffectInputOptions() {
        let effectList = this.currentGame.items;
        let effectOptions = [];
        effectList.forEach((groupItem) => {
            if(groupItem.hasOwnProperty('kind') && groupItem.kind == 2) {
                let groupList = [];
                effectList.forEach((effectItem) => {
                    if(effectItem.hasOwnProperty('p') && effectItem.p == groupItem.bid) {
                        groupList.push({'label': effectItem.name, 'value': effectItem.bid});
                    }
                });
                effectOptions.push({'group': groupItem.name, 'items': groupList});
            }
        });

        let noGroupList = [];
        effectList.forEach((effectItem) => {
            if(!effectItem.hasOwnProperty('p') && !effectItem.hasOwnProperty('kind')) {
                noGroupList.push({'label': effectItem.name, 'value': effectItem.bid});
            }
        });
        effectOptions.push({'group': 'Ungrouped', 'items': noGroupList});

        return effectOptions;
    }

    loadGameMenu(gameId) {
        axios.get("https://api.crowdcontrol.live/menu/"+gameId).then(response => {
            console.log('[CrowdControlAgent] setting selected game to '+response.data.menu.id);
            this.currentGame = response.data.menu;
        }).catch(e => {console.log(e); return null; });
    }

    setGame(gameId) {
        this.agentRegistry.setAgentFieldData(this,'selectedGameId', gameId);
        this.agentRegistry.saveAppData();
        this.loadGameMenu(gameId);
    }

    createSocket() {
        this.socket = io("wss://overlay-socket.crowdcontrol.live");
        this.socket.on("effect-initial", (args) => {
            this.handleEffectInitial(args);
        });
        this.socket.on("effect-update", (args) => {
            this.handleEffectUpdate(args);
        });

        this.socket.onAny((eventName, ...args) => {
            console.log("[CrowdControlAgent] " + eventName + " event received from Crowd Control");
        });

        this.socket.on("connect", () => {
            console.log("[CrowdControlAgent] Connected to Crowd Control!! Socket ID: " + this.socket.id);
            console.log("[CrowdControlAgent] Getting events from channel " + this.agentRegistry.getAgentFieldData(this,'channelName'));
            this.socket.emit("events", this.agentRegistry.getAgentFieldData(this,'channelName'));
            this.socketConnected = true;
        });

        this.socket.on("disconnect", () => {
            console.log("[CrowdControlAgent] Disconnected from Crowd Control! ");
            this.socketConnected = false;
        });

        this.socket.io.on("error", (error) => {
            console.log("[CrowdControlAgent] Socket Error: " + error);
        });
    }

    handleEffectInitial(effect) {
        //Initial event feed.  We use this to add a new entity to the list
        if (!this.effectQueue.hasOwnProperty(effect.id)) {

            let targeted = false;
            if(effect.hasOwnProperty('targets')) {
                effect.targets.forEach((target) => {
                    if (target.name === this.agentRegistry.getAgentFieldData(this,'channelName').toLowerCase()) {
                        targeted = true;
                    }
                });
            } else {
                targeted = true;
            }

            if(targeted == true) {
                this.effectQueue[effect.id] = {...effect};
                this.effectQueue[effect.id].triggerInfo = {
                    "effectId": effect.effect.safeName
                };
                if(effect.effect.parameters[0] !== undefined) {
                    this.effectQueue[effect.id].triggerInfo.quantity = effect.effect.parameters[0];
                }

                this.effectQueue[effect.id].timed_effect = false;
                if (effect.effect.duration > 0) {
                    this.effectQueue[effect.id].timed_effect = true;
                    this.effectQueue[effect.id].triggerInfo.duration = effect.effect.duration;
                }
                this.effectQueue[effect.id].last_update = "added";
                console.log(`[CrowdControlAgent] Registering CC Event: "${effect.id}"`);
            }
        }
    }

    handleEffectUpdate(effect) {
        //This is an update to an effect.  We use this to queue/unqueue/complete effects, as well as start/stop/pause/resume timed effects
        if (!this.effectQueue.hasOwnProperty(effect.id)) {
            console.log(`[CrowdControlAgent] Update for unknown effect: "${effect.id}"`);
            return;
        }

        let current_effect = this.effectQueue[effect.id];
        current_effect.last_update = effect.type;

        console.log(`Detected effect update of type: "${effect.type}" for "${effect.id}"`);
        console.log(effect);
        switch (effect.type) {
            case "queue":
                if (current_effect.last_update !== "queue") {
                    console.log(`[CrowdControlAgent] Queued effect: "${effect.id}"`);
                }
                break;
            case "unqueue":
                console.log(`[CrowdControlAgent] Unqueued and removed effect: "${effect.id}"`);
                delete this.effectQueue[effect.id];
                break;
            case "completed":
                console.log(`[CrowdControlAgent] triggered effect: "${effect.id}"`);
                this.agentRegistry.handleInputTrigger(this.agentKey, "effect","completed", current_effect.triggerInfo);
                break;
            case "start":
                console.log(`[CrowdControlAgent] started effect: "${effect.id}"`);
                this.agentRegistry.handleInputTrigger(this.agentKey, "effect","start", current_effect.triggerInfo);
                break;
            case "pause":
                console.log(`[CrowdControlAgent] paused effect: "${effect.id}"`);
                this.agentRegistry.handleInputTrigger(this.agentKey, "effect","pause", current_effect.triggerInfo);
                break;
            case "resume":
                console.log(`[CrowdControlAgent] resumed effect: "${effect.id}"`);
                this.agentRegistry.handleInputTrigger(this.agentKey, "effect","resume", current_effect.triggerInfo);
                break;
            case "stop":
                console.log(`[CrowdControlAgent] Stopped and removed effect: "${effect_object.id}"`);
                this.agentRegistry.handleInputTrigger(this.agentKey, "effect","stop", current_effect.triggerInfo);
                delete this.effectQueue[effect_object.id];
                break;
            default:
            // we don't handle this type of update
        }

    }

};