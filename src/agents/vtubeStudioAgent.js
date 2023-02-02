const { WebSocket } = require("ws");
const { ApiClient } = require("vtubestudio");
const Base64Icon = require('../base64Icon');
module.exports = class VtubeStudioAgent {

    constructor() {
        let icon = new Base64Icon;
        this.apiClient = null;
        this.apiOptions = {
            authTokenGetter: () => {return this.agentRegistry.getAgentFieldData(this,'vtsAuthKey');},
            authTokenSetter: (token) => {this.agentRegistry.setAgentFieldData(this,'vtsAuthKey', token); this.agentRegistry.saveAppData();},
            webSocketFactory: (url) => new WebSocket(url),
            pluginName: "TuberYeets",
            pluginDeveloper: "Jayo",
            pluginIcon: icon.iconData,
            port: 8001,
        };
        this.agentRegistry = null;
        this.agentName = 'VTube Studio';
        this.agentKey = 'vtubestudio';
        this.agentLabel = 'VTS';
        this.agentSettings = [
            {"name": "enabled", "default": false},
            {"name": "port", "default": 8001},
            {"name": "vtsAuthKey", "default": ""}
        ];
        this.agentInputs = {};
        this.agentOutputs = {
            expression: {
                'key': 'expression',
                'label': 'Change Expression',
                'description': 'Activate or Deactivate a VTS expression',
                'handler': this.handleExpressionOutput,
                'settings': [
                    {
                        'key': 'type',
                        'label': 'Action',
                        'type': 'list',
                        'options': function () {
                            return [
                                {'label': 'Activate', 'value': 'activate'},
                                {'label': 'Deactivate', 'value': 'deactivate'},
                            ]
                        },
                        'default': 'activate'
                    },
                    {
                        'key': 'name',
                        'label': 'VTS Expression',
                        'type': 'list',
                        'options': this.getExpressionOutputOptions,
                        'default': ''
                    }
                ]
            },
            hotkey: {
                'key': 'hotkey',
                'label': 'Activate Hotkey',
                'description': 'Activate a VTS Hotkey',
                'handler': this.handleHotkeyOutput,
                'settings': [
                    {
                        'key': 'name',
                        'label': 'VTS Hotkey',
                        'type': 'list',
                        'options': this.getHotkeyOutputOptions,
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
        this.apiOptions.port = this.agentRegistry.getAgentFieldData(this,'port');
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

    getExpressionOutputOptions() {
        var expression_names = this.getExpressions();
        var expression_options = [];
        expression_names.forEach((expression_name) => {
            expression_options.push({'label': expression_name, 'value': expression_name});
        });
        return expression_options;
    }

    handleExpressionOutput(values) {
        if(values.type == 'activate') {
            this.activateExpression(values.name);
        } else {
            this.deactivateExpression(values.name);
        }
    }

    getHotkeyOutputOptions() {
        var hotkey_names = this.getHotkeys();
        var hotkey_options = [];
        hotkey_names.forEach((hotkey_name) => {
            hotkey_options.push({'label': hotkey_name, 'value': hotkey_name});
        });
        return hotkey_options;
    }

    handleHotkeyOutput(values) {
        this.triggerHotkey(values.name);
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
        this.agentRegistry.saveAppData();
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

    async getHotkeys() {
        if(!this.vtsReady) return;
        const model = await this.apiClient.currentModel();
        const hotkeys = await model.hotkeys();
        let hotkey_names = [];

        hotkeys.forEach((hotkey) => {
            hotkey_names.push(hotkey.name);
        });
        console.log("VTS: got current model hotkeys ", hotkey_names);
        return hotkey_names;
    }

    async getExpressions() {
        if(!this.vtsReady) return;
        const model = await this.apiClient.currentModel();
        const expressions = await model.expressions();
        let expression_names = [];

        expressions.forEach((expression) => {
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

    async activateExpression(expression_name) {
        if(!this.vtsReady) return;
        const model = await this.apiClient.currentModel();
        const expressions = await model.expressions();
        var expressionToUse = expressions.find((expression) => expression.name === expression_name);

        if(expressionToUse) {
            expressionToUse.activate();
            console.log(`VTS: Expression ${expression_name} activated`);
        } else {
            console.log(`Could not find Expression: ${expression_name}`);
        }
    }

    async deactivateExpression(expression_name) {
        if(!this.vtsReady) return;
        const model = await this.apiClient.currentModel();
        const expressions = await model.expressions();
        var expressionToUse = expressions.find((expression) => expression.name === expression_name);

        if(expressionToUse) {
            //the vtubestudio library has a broken Expression::deactivate method, so we improvise
            await expressionToUse.vts.apiClient.expressionActivation({ expressionFile: expressionToUse.file, active: false });
            console.log(`VTS: Expression ${expression_name} deactivated`);
        } else {
            console.log(`Could not find Expression: ${expression_name}`);
        }
    }

    async triggerHotkey(hotkey_name) {
        if(!this.vtsReady) return;
        const model = await this.apiClient.currentModel();
        const hotkeys = await model.hotkeys();
        var hotkeyToTrigger = hotkeys.find((hotkey) => hotkey.name === hotkey_name);

        if(hotkeyToTrigger) {
            hotkeyToTrigger.trigger();
            console.log(`VTS: Hotkey ${hotkey_name} triggered`);
        } else {
            console.log(`Could not find Hotkey: ${hotkey_name}`);
        }
    }
};