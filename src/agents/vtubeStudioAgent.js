const { WebSocket } = require("ws");
const { ApiClient } = require("vtubestudio");
const Base64Icon = require('../base64Icon');
class VtubeStudioAgent {

    constructor(agentRegistry) {
        let icon = new Base64Icon;
        this.apiClient = null;
        this.apiOptions = {
            authTokenGetter: () => {return this.agentRegistry.getAgentFieldData(this,'vtsAuthKey');},
            authTokenSetter: (token) => {this.agentRegistry.setAgentFieldData(this,'vtsAuthKey', token);},
            webSocketFactory: (url) => new WebSocket(url),
            pluginName: "TuberYeets",
            pluginDeveloper: "Jayo",
            pluginIcon: icon.iconData,
            port: 8001,
        };
        this.stacks = {"expression" : {}, "hotkey" : {}};
        this.hotkeyStacks = {};

        this.agentRegistry = agentRegistry;
        this.agentName = 'VTube Studio';
        this.agentKey = 'vtubestudio';
        this.agentLabel = 'VTube Studio';
        this.agentDescription = "Control VTS in response to activated Triggers. Handle Expressions, hotkeys, and more!";
        this.agentSettingsForm = 'VtubeStudioSettings';
        this.agentSettings = [
            {
                key: "enabled",
                label: "Enabled",
                type: "toggle",
                settable: false,
                default: false
            },
            {
                key: "vtsAuthKey",
                label: "VTS API Token",
                type: "text",
                settable: false,
                default: ""
            },
            {
                key: "port",
                label: "VTS API Port",
                type: "text",
                help: "The TCP Port that the VTube Studio API is configured to listen on",
                settable: true,
                default: "8001"
            }

        ];
        this.agentInputs = {};
        this.agentOutputs = {
            expression: new ExpressionOutput(this),
            hotkey: new HotkeyOutput(this),
            negateHotkey: new NegateHotkeyOutput(this),
            moveModel: new MoveModelOutput(this)
        };

    }

    agentRegistered() {
        this.log("running agentRegistered()...");
        if(this.agentRegistry.getAgentFieldData(this,'enabled')) {
            this.agentEnabled();
        }
    }

    agentEnabled() {
        this.log("Agent Enabled.");
        this.apiOptions.port = parseInt(this.agentRegistry.getAgentFieldData(this,'port'));
        this.apiClient = new ApiClient(this.apiOptions);
        this.apiClient.on("connect", () => {
            this.log("Connected to VTube Studio!");
            this.getStats();
        }) ;
        this.apiClient.on("disconnect", () => {
            this.log("Lost connection to VTube Studio!");
        }) ;
        this.apiClient.on("error", (err) => {
            this.log("Error In VTube Studio");
            this.log(err);
        }) ;
    }

    agentDisabled() {
        if(this.apiClient && (this.apiClient.isConnected || this.apiClient.isConnecting)) {
            this.apiClient.disconnect;
        }
        this.apiClient = null;
        this.log("Agent Disabled.");
    }

    agentStatus() {
        if(!this.agentRegistry.getAgentFieldData(this,'enabled')) {
            return 'disabled';
        }
        let status = 'disconnected';
        if(this.apiClient && (this.apiClient.isConnected || this.apiClient.isConnecting)) {
            if(this.apiClient.isConnecting) {
                status = 'connecting';
            }
            if(this.apiClient.isConnected) {
                status = 'connected';
            }
        }
        return status;
    }

    log(...messages) {
        console.group(`${new Date().toISOString()} [VTubeStudioAgent]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

    getAuthToken() {
        this.agentRegistry.getAgentFieldData(this,'vtsAuthKey');
    }

    setAuthToken(authToken) {
        this.agentRegistry.setAgentFieldData(this,'vtsAuthKey', authToken);
    }

    async getStats() {
        try {
            const stats = await this.apiClient.statistics();
            this.log("Connected to VTube Studio version ", stats.vTubeStudioVersion);
            this.vtsReady = true;
        } catch (e) {
            this.vtsReady = false;
            console.error("VTS ERROR: " + e);
        }
    }

    async getModelId() {
        if(!this.vtsReady) return;
        const model = await this.apiClient.currentModel();
        return model.modelLoaded ? model.modelID : false;
    }

    async getHotkeys() {
        if(!this.vtsReady) return;
        const hotkeys = await this.apiClient.hotkeysInCurrentModel();
        this.log(hotkeys);
        let hotkey_names = [];

        hotkeys.availableHotkeys.forEach((hotkey) => {
            hotkey_names.push(hotkey.name);
        });
        this.log("VTS: got current model hotkeys ", hotkey_names);
        return hotkey_names;
    }

    async getExpressions() {
        if(!this.vtsReady) return;
        const expressions = await this.apiClient.expressionState();
        this.log(expressions);
        let expression_names = [];

        expressions.expressions.forEach((expression) => {
            expression_names.push(expression.name);
        });
        this.log("VTS: got current model expressions ", expression_names);
        return expression_names;
    }

    async setDefaultParamValue(param, value) {
        if(!this.vtsReady) return;
        const model = await this.apiClient.currentModel();
        const parameters = await model.defaultParameters();
        var parameterToSet = parameters.find((parameter) => parameter.name === param);

        if(parameterToSet) {
            parameterToSet.setValue(value);
            this.log(`VTS: Parameter ${param} set to ${value}`);
        } else {
            this.log(`Could not find Parameter: ${param}`);
        }
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

    async activateExpression(expression_name) {
        if(!this.vtsReady) return;
        const expressions = await this.apiClient.expressionState();
        const expressionToUse = expressions.expressions.find((expression) => expression.name === expression_name);

        if(expressionToUse) {
            this.apiClient.expressionActivation({ expressionFile: expressionToUse.file, active: true});
            this.log(`VTS: Expression ${expression_name} activated`);
        } else {
            this.log(`Could not find Expression: ${expression_name}`);
        }
    }

    async deactivateExpression(expression_name) {
        if(!this.vtsReady) return;
        const expressions = await this.apiClient.expressionState();
        const expressionToUse = expressions.expressions.find((expression) => expression.name === expression_name);

        if(expressionToUse) {
            await this.apiClient.expressionActivation({ expressionFile: expressionToUse.file, active: false });
            this.log(`VTS: Expression ${expression_name} deactivated`);
        } else {
            this.log(`Could not find Expression: ${expression_name}`);
        }
    }

    async triggerHotkey(hotkey_name) {
        if(!this.vtsReady) return;
        const hotkeys = await this.apiClient.hotkeysInCurrentModel();
        const hotkeyToTrigger = hotkeys.availableHotkeys.find((hotkey) => hotkey.name === hotkey_name);

        if(hotkeyToTrigger) {
            await this.apiClient.hotkeyTrigger({hotkeyID: hotkeyToTrigger.hotkeyID});
            this.log(`VTS: Hotkey ${hotkey_name} triggered`);
        } else {
            this.log(`Could not find Hotkey: ${hotkey_name}`);
        }
    }

    async moveModel(positionX = null, positionY = null, size = null, rotation = null, timeInSeconds = 0.00, valuesAreRelativeToModel = false) {
        if(!this.vtsReady) return;
        let requestPayload = {
            timeInSeconds: timeInSeconds,
            valuesAreRelativeToModel: valuesAreRelativeToModel
        };
        if(positionX) {
            requestPayload.positionX = positionX;
        }
        if(positionY) {
            requestPayload.positionY = positionY;
        }
        if(size) {
            requestPayload.size = size;
        }
        if(rotation) {
            requestPayload.rotation = rotation;
        }
        const moveResult = await this.apiClient.moveModel(requestPayload);

        if(moveResult) {
            this.log(`VTS: Model Movement triggered`);
        } else {
            this.log(`Could not move model!`);
        }
    }
}
class ExpressionOutput {
    constructor(agent) {
        this.agent = agent;
        this.gdh = this.agent.agentRegistry.gameData;
        this.key = 'expression';
        this.label = 'Change Expression';
        this.description = 'Activate or Deactivate a VTS expression';
        this.requireAgentConnection = true;
        this.settings = [
            {
                'key': 'type',
                'label': 'Action',
                'type': 'list',
                'options':  [
                    {'label': 'Activate', 'value': 'activate'},
                    {'label': 'Deactivate', 'value': 'deactivate'},
                ],
                'default': 'activate'
            },
            {
                'key': 'name',
                'label': 'VTS Expression',
                'type': 'list',
                'optionsLoader': this.getExpressionOptions.bind(this),
                'default': ''
            }
        ]

    }

    log(...messages) {
        console.group(`${new Date().toISOString()} [VTubeStudioAgent > ExpressionOutput]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

    async getExpressionOptions() {
        let expression_options = [];
        if(!this.agent.vtsReady) return [];
        let expression_names = await this.agent.getExpressions();
        expression_names.forEach((expression_name) => {
            expression_options.push({'label': expression_name, 'value': expression_name});
        });
        return expression_options;
    }

    handleOutput(values) {
        if(values.type === 'activate') {
            if(this.agent.incrementStack('expression', values.name) === 1) {
                this.agent.activateExpression(values.name);
            }
        } else {
            if(this.agent.decrementStack('expression', values.name) === 0) {
                this.agent.deactivateExpression(values.name);
            }
        }
    }

    handleRender(settings) {

        return `<ul>` +
            `<li><span><strong>${settings.type === 'activate' ? 'Activate' : 'Deactivate'}</strong> the <strong>${settings.name}</strong> expression</span></li>` +
            `</ul>`;
    }



}
class HotkeyOutput {
    constructor(agent) {
        this.agent = agent;
        this.gdh = this.agent.agentRegistry.gameData;
        this.key = 'hotkey';
        this.label = 'Activate Hotkey';
        this.description = 'Activate a VTS Hotkey';
        this.requireAgentConnection = true;
        this.settings = [
            {
                'key': 'name',
                'label': 'VTS Hotkey',
                'type': 'list',
                'optionsLoader': this.getHotkeyOptions.bind(this),
                'default': ''
            }
        ]

    }

    log(...messages) {
        console.group(`${new Date().toISOString()} [VTubeStudioAgent > HotkeyOutput]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

    async getHotkeyOptions() {
        let hotkey_options = [];
        if(!this.agent.vtsReady) return [];
        let hotkey_names = await this.agent.getHotkeys();
        hotkey_names.forEach((hotkey_name) => {
            hotkey_options.push({'label': hotkey_name, 'value': hotkey_name});
        });
        return hotkey_options;
    }

    handleOutput(values) {
        if(this.agent.incrementStack('hotkey', values.name) === 1) {
            this.agent.triggerHotkey(values.name);
        }
    }

    handleRender(settings) {
        return `<ul>` +
            `<li><span>Trigger hotkey <strong>${settings.name} </strong></span></li>` +
            `</ul>`;
    }

}
class NegateHotkeyOutput {
    constructor(agent) {
        this.agent = agent;
        this.gdh = this.agent.agentRegistry.gameData;
        this.key = 'negateHotkey';
        this.label = 'Negate Hotkey';
        this.description = 'Negate a VTS Hotkey with another Hotkey';
        this.requireAgentConnection = true;
        this.settings = [
            {
                'key': 'target',
                'label': 'Hotkey to Negate',
                'type': 'list',
                'optionsLoader': this.getHotkeyOptions.bind(this),
                'default': ''
            },
            {
                'key': 'name',
                'label': 'Hotkey to Use',
                'type': 'list',
                'optionsLoader': this.getHotkeyOptions.bind(this),
                'default': ''
            }
        ]

    }

    log(...messages) {
        console.group(`${new Date().toISOString()} [VTubeStudioAgent > NegateHotkeyOutput]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

    async getHotkeyOptions() {
        let hotkey_options = [];
        if(!this.agent.vtsReady) return [];
        let hotkey_names = await this.agent.getHotkeys();
        hotkey_names.forEach((hotkey_name) => {
            hotkey_options.push({'label': hotkey_name, 'value': hotkey_name});
        });
        return hotkey_options;
    }

    handleOutput(values) {
        if(this.agent.decrementStack('hotkey', values.target) === 0) {
            this.agent.triggerHotkey(values.name);
        }
    }

    handleRender(settings) {
        return `<ul>` +
            `<li><span>Negate hotkey <strong>${settings.target}</strong> with hotkey <strong>${settings.name}</strong></span></li>` +
            `</ul>`;
    }
}
class MoveModelOutput {
    constructor(agent) {
        this.agent = agent;
        this.gdh = this.agent.agentRegistry.gameData;
        this.key = 'moveModel';
        this.label = 'Move Model';
        this.description = 'Move the VTS Model to a specified position';
        this.requireAgentConnection = true;
        this.settings = [
            {
                'key': 'valuesAreRelativeToModel',
                'label': 'Relative to Current Position',
                'type': 'toggle',
                'default': true
            },
            {
                'key': 'timeInSeconds',
                'label': 'Movement Time',
                'type': 'number',
                'min': 0.00,
                'max': 2.00,
                'step': 0.01,
                'default': 0.00
            },
            {
                'key': 'changePositionX',
                'label': 'Change X Position',
                'type': 'toggle',
                'default': false
            },
            {
                'key': 'positionX',
                'label': 'X Position',
                'type': 'number',
                'min': -3.000,
                'max': 3.000,
                'step': 0.001,
                'default': 0.000,
                'showIfToggled': 'changePositionX'
            },
            {
                'key': 'changePositionY',
                'label': 'Change Y Position',
                'type': 'toggle',
                'default': false
            },
            {
                'key': 'positionY',
                'label': 'Y Position',
                'type': 'number',
                'min': -3.000,
                'max': 3.000,
                'step': 0.001,
                'default': 0.000,
                'showIfToggled': 'changePositionY'
            },
            {
                'key': 'changeSize',
                'label': 'Change Size',
                'type': 'toggle',
                'default': false
            },
            {
                'key': 'size',
                'label': 'Size',
                'type': 'number',
                'min': -100.00,
                'max': 100.00,
                'step': 0.01,
                'default': 0.00,
                'showIfToggled': 'changeSize'
            },
            {
                'key': 'changeRotation',
                'label': 'Change Rotation',
                'type': 'toggle',
                'default': false
            },
            {
                'key': 'rotation',
                'label': 'Rotation',
                'type': 'number',
                'min': -360.0,
                'max': 360.0,
                'step': 0.1,
                'default': 0.0,
                'showIfToggled': 'changeRotation'
            },
        ]
    }

    handleOutput(values) {
        this.agent.moveModel(
            values.changePositionX ? values.positionX : null,
            values.changePositionY ? values.positionY : null,
            values.changeSize ? values.size : null,
            values.changeRotation ? values.rotation : null,
            values.timeInSeconds,
            values.valuesAreRelativeToModel
        );
    }

    handleRender(settings) {
        let relativeTo = settings.valuesAreRelativeToModel ? 'Model' : 'Stage';

        let positionXItem = '';
        if(settings.changePositionX) {
            positionXItem = `<li><span>X <strong>${settings.positionX}</strong></span></li>`;
        }
        let positionYItem = '';
        if(settings.changePositionY) {
            positionYItem = `<li><span>Y <strong>${settings.positionY}</strong></span></li>`;
        }
        let sizeItem = '';
        if(settings.changeSize) {
            sizeItem = `<li><span>Size <strong>${settings.size}</strong></span></li>`;
        }
        let rotationItem = '';
        if(settings.changeRotation) {
            rotationItem = `<li><span>Rotation <strong>${settings.rotation}</strong></span></li>`;
        }
        return `<ul>` +
            `<li><span>Relative to <strong>${relativeTo}</strong></span></li>` +
            `<li><span>Move in <strong>${settings.timeInSeconds}</strong>s</span></li>` +
            `${positionXItem}` +
            `${positionYItem}` +
            `${sizeItem}` +
            `${rotationItem}` +
            `</ul>`;
    }

}
module.exports = VtubeStudioAgent;