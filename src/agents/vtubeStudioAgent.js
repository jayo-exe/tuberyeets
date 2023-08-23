const { WebSocket } = require("ws");
const { ApiClient } = require("vtubestudio");
const Base64Icon = require('../base64Icon');
module.exports = class VtubeStudioAgent {

    constructor() {
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

        this.agentRegistry = null;
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
            expression: {
                'key': 'expression',
                'label': 'Change Expression',
                'description': 'Activate or Deactivate a VTS expression',
                'handler': "handleExpressionOutput",
                'infoRenderHandler': "handleExpressionRender",
                'requireAgentConnection': true,
                'settings': [
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
                        'optionsLoader': "getExpressionOutputOptions",
                        'default': ''
                    }
                ]
            },
            hotkey: {
                'key': 'hotkey',
                'label': 'Activate Hotkey',
                'description': 'Activate a VTS Hotkey',
                'handler': "handleHotkeyOutput",
                'infoRenderHandler': "handleHotkeyRender",
                'requireAgentConnection': true,
                'settings': [
                    {
                        'key': 'name',
                        'label': 'VTS Hotkey',
                        'type': 'list',
                        'optionsLoader': "getHotkeyOutputOptions",
                        'default': ''
                    }
                ]
            },
            negateHotkey: {
                'key': 'negateHotkey',
                'label': 'Negate Hotkey',
                'description': 'Negate a VTS Hotkey with another Hotkey',
                'handler': "handleNegateHotkeyOutput",
                'infoRenderHandler': "handleNegateHotkeyRender",
                'requireAgentConnection': true,
                'settings': [
                    {
                        'key': 'target',
                        'label': 'Hotkey to Negate',
                        'type': 'list',
                        'optionsLoader': "getHotkeyOutputOptions",
                        'default': ''
                    },
                    {
                        'key': 'name',
                        'label': 'Hotkey to Use',
                        'type': 'list',
                        'optionsLoader': "getHotkeyOutputOptions",
                        'default': ''
                    }
                ]
            }
        };

    }

    agentRegistered(agentRegistry) {
        console.log("[VTSAgent] running agentRegistered()...");
        this.agentRegistry = agentRegistry;
        if(this.agentRegistry.getAgentFieldData(this,'enabled')) {
            this.agentEnabled();
        }
    }

    agentEnabled() {
        console.log("[VTSAgent] Agent Enabled.");
        this.apiOptions.port = parseInt(this.agentRegistry.getAgentFieldData(this,'port'));
        this.apiClient = new ApiClient(this.apiOptions);
        this.apiClient.on("connect", () => {
            console.log("[VTSAgent] Connected to VTube Studio!");
            this.getStats();
        }) ;
        this.apiClient.on("disconnect", () => {
            console.log("[VTSAgent] Lost connection to VTube Studio!");
        }) ;
        this.apiClient.on("error", (err) => {
            console.log("[VTSAgent] Error In VTube Studio");
            console.log(err);
        }) ;
    }

    agentDisabled() {
        if(this.apiClient && (this.apiClient.isConnected || this.apiClient.isConnecting)) {
            this.apiClient.disconnect;
        }
        this.apiClient = null;
        console.log("[VTSAgent] Agent Disabled.");
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

    async getExpressionOutputOptions() {
        let expression_options = [];
        if(!this.vtsReady) return [];
        let expression_names = await this.getExpressions();
        expression_names.forEach((expression_name) => {
            expression_options.push({'label': expression_name, 'value': expression_name});
        });
        return expression_options;
    }

    handleExpressionOutput(values) {
        if(values.type == 'activate') {
            if(this.incrementStack('expression', values.name) === 1) {
                this.activateExpression(values.name);
            }
        } else {
            if(this.decrementStack('expression', values.name) === 0) {
                this.deactivateExpression(values.name);
            }
        }
    }

    handleExpressionRender(settings) {

        return `<ul>` +
            `<li><span><strong>${settings.type === 'activate' ? 'Activate' : 'Deactivate'}</strong> the <strong>${settings.name}</strong> expression</span></li>` +
            `</ul>`;
    }

    async getHotkeyOutputOptions() {
        let hotkey_options = [];
        if(!this.vtsReady) return [];
        let hotkey_names = await this.getHotkeys();
        hotkey_names.forEach((hotkey_name) => {
            hotkey_options.push({'label': hotkey_name, 'value': hotkey_name});
        });
        return hotkey_options;
    }

    handleHotkeyOutput(values) {
        if(this.incrementStack('hotkey', values.name) === 1) {
            this.triggerHotkey(values.name);
        }
    }

    handleHotkeyRender(settings) {
        return `<ul>` +
            `<li><span>Trigger hotkey <strong>${settings.name} </strong></span></li>` +
            `</ul>`;
    }

    handleNegateHotkeyOutput(values) {
        if(this.decrementStack('hotkey', values.target) === 0) {
            this.triggerHotkey(values.name);
        }
    }

    handleNegateHotkeyRender(settings) {
        return `<ul>` +
            `<li><span>Negate hotkey <strong>${settings.target}</strong> with hotkey <strong>${settings.name}</strong></span></li>` +
            `</ul>`;
    }

    setPort(new_port) {
        var old_port = this.port;
        this.port = new_port;
        if(old_port != new_port) {
            this.connectSocket();
        }

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
            console.log("[VTSAgent] Connected to VTube Studio version ", stats.vTubeStudioVersion);
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
        console.log(hotkeys);
        let hotkey_names = [];

        hotkeys.availableHotkeys.forEach((hotkey) => {
            hotkey_names.push(hotkey.name);
        });
        console.log("VTS: got current model hotkeys ", hotkey_names);
        return hotkey_names;
    }

    async getExpressions() {
        if(!this.vtsReady) return;
        const expressions = await this.apiClient.expressionState();
        console.log(expressions);
        let expression_names = [];

        expressions.expressions.forEach((expression) => {
            expression_names.push(expression.name);
        });
        console.log("VTS: got current model expressions ", expression_names);
        return expression_names;
    }

    async setDefaultParamValue(param, value) {
        if(!this.vtsReady) return;
        const model = await this.apiClient.currentModel();
        const parameters = await model.defaultParameters();
        var parameterToSet = parameters.find((parameter) => parameter.name === param);

        if(parameterToSet) {
            parameterToSet.setValue(value);
            console.log(`VTS: Parameter ${param} set to ${value}`);
        } else {
            console.log(`Could not find Parameter: ${param}`);
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
            console.log(`VTS: Expression ${expression_name} activated`);
        } else {
            console.log(`Could not find Expression: ${expression_name}`);
        }
    }

    async deactivateExpression(expression_name) {
        if(!this.vtsReady) return;
        const expressions = await this.apiClient.expressionState();
        const expressionToUse = expressions.expressions.find((expression) => expression.name === expression_name);

        if(expressionToUse) {
            await this.apiClient.expressionActivation({ expressionFile: expressionToUse.file, active: false });
            console.log(`VTS: Expression ${expression_name} deactivated`);
        } else {
            console.log(`Could not find Expression: ${expression_name}`);
        }
    }

    async triggerHotkey(hotkey_name) {
        if(!this.vtsReady) return;
        const hotkeys = await this.apiClient.hotkeysInCurrentModel();
        const hotkeyToTrigger = hotkeys.availableHotkeys.find((hotkey) => hotkey.name === hotkey_name);

        if(hotkeyToTrigger) {
            await this.apiClient.hotkeyTrigger({hotkeyID: hotkeyToTrigger.hotkeyID});
            console.log(`VTS: Hotkey ${hotkey_name} triggered`);
        } else {
            console.log(`Could not find Hotkey: ${hotkey_name}`);
        }
    }
};