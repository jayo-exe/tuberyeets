const EventManager = require('./eventManager');

module.exports = class AgentRegistry {
    constructor(appDataHelper, gameDataHelper) {
        this.agents = {};
        this.inputs = {};
        this.outputs = {};

        this.appData = appDataHelper;
        this.gameData = gameDataHelper;
        this.eventManager = new EventManager(this);
        if(!this.appData.has('agents')) {
            console.log(`[AgentRegistry] Agent Data store not found! Creating...`);
            this.appData.update('agents', {});
        }
    }

    hasAgentFieldData(agent, field) {
        return this.appData.has(`agents.${agent.agentKey}.${field}`);
    }

    getAgentFieldData(agent, field) {
        var agentData = this.appData.read('agents');
        if(!agentData.hasOwnProperty(agent.agentKey)) return undefined;
        if(!agentData[agent.agentKey].hasOwnProperty(field)) return undefined;
        return agentData[agent.agentKey][field];
    }

    setAgentFieldData(agent, field, value) {
        var agentData = this.appData.read('agents');
        if(!agentData.hasOwnProperty(agent.agentKey)) agentData[agent.agentKey] = {};
        if(!agentData[agent.agentKey].hasOwnProperty(field)) agentData[agent.agentKey][field] = {};
        agentData[agent.agentKey][field] = value;
        console.log(`[AgentRegistry] Setting field ${field} for agent ${agent.agentKey}...`);
        return this.appData.update('agents',agentData);
    }

    registerAgent(agent) {
        console.log(`[AgentRegistry] Registering agent ${agent.agentKey}...`);
        //add agent to list
        if (this.agents.hasOwnProperty(agent.agentKey)) {
            console.log(`[AgentRegistry] cannot register ${agent.agentKey}, the agent is already registered`);
            return false;
        }
        this.agents[agent.agentKey] = agent;

        agent.agentSettings.forEach((setting) => {
            if(!this.hasAgentFieldData(agent, setting.key)) {
                this.setAgentFieldData(agent, setting.key, setting.default);
            }
        });

        //fire agent init routine
        console.log(`[AgentRegistry] Firing registry routine for agent ${agent.agentKey}...`);
        agent.agentRegistered(this);
    }

    activateAgent(agentKey) {
        let agent = this.agents[agentKey];
        if (!agent) { return false; }
        this.setAgentFieldData(agent,'enabled', true);
        agent.agentEnabled();
        console.log(`[AgentRegistry] Activated agent ${agent.agentKey}...`);
        return true;
    }

    deactivateAgent(agentKey) {
        let agent = this.agents[agentKey];
        if (!agent) { return false; }
        this.setAgentFieldData(agent,'enabled', false);
        agent.agentDisabled();
        console.log(`[AgentRegistry] Deactivated agent ${agent.agentKey}...`);
        return true;
    }

    reloadAgent(agentKey) {
        let agent = this.agents[agentKey];
        if (!agent) { return false; }
        this.deactivateAgent(agentKey);
        this.activateAgent(agentKey);
        console.log(`[AgentRegistry] Reloaded agent ${agent.agentKey}...`);
        return true;
    }

    getAgent(agentKey) {
        let agent = this.agents[agentKey];
        if (!agent) { return false; }
        return agent;
    }

    getAgentStatus(agentKey) {
        let agent = this.agents[agentKey];
        if (!agent) { return false; }
        return agent.agentStatus()
    }

    getAllAgentStatus() {
        let all_status = {};
        for (const [key, agent] of Object.entries(this.agents)) {
            let agent_enabled = this.getAgentFieldData(agent,'enabled');
            let agent_status = agent.agentStatus();
            all_status[key] = {key: key, name: agent.agentName, enabled: agent_enabled, status: agent_status }
        }
        return all_status;
    }

    getAvailableEvents() {
        let availableEvents = {};
        for (const [key, agent] of Object.entries(this.agents)) {
            if(this.getAgentFieldData(agent,'enabled') === true
                && agent.hasOwnProperty('agentInputs')
                && Object.keys(agent.agentInputs).length > 0)
            {
                availableEvents[key] = {name:agent.agentLabel, options:{}};
                for (const [inputKey, input] of Object.entries(agent.agentInputs)) {
                    availableEvents[key].options[inputKey] = {
                        key:input.key,
                        label:input.label,
                        description:input.description,
                        agent:key,
                    };
                }
            }
        }
        return availableEvents;
    }

    async getEventSettings(agentKey, eventKey) {
        let agent = this.agents[agentKey];
        if (!agent) { return false; }
        let event = agent.agentInputs[eventKey];
        if (!event) { return false; }
        let settings = {...event.settings};
        for (const [settingKey, setting] of Object.entries(settings)) {
            if (setting.hasOwnProperty('optionsLoader')) {
                let parsed_options = await agent[setting.optionsLoader]();
                setting.options = parsed_options;
            }
        }
        console.log(settings)
        return settings;
    }

    getAvailableActions() {
        let availableActions = {};
        for (const [key, agent] of Object.entries(this.agents)) {
            if( agent.hasOwnProperty('agentOutputs')
                && Object.keys(agent.agentOutputs).length > 0)
            {
                availableActions[key] = {name:agent.agentLabel, options:{}};
                for (const [outputKey, output] of Object.entries(agent.agentOutputs)) {
                    availableActions[key].options[outputKey] = {
                        key:output.key,
                        label:output.label,
                        description:output.description,
                        requireAgentConnection: output.requireAgentConnection,
                        agent:key,
                    };
                }
            }
        }
        return availableActions;
    }

    async getActionSettings(agentKey, actionKey) {
        console.log(`[AgentRegistry] getting action settings for ${agentKey}:${actionKey}`);
        let agent = this.agents[agentKey];
        if (!agent) { return false; }
        let action = agent.agentOutputs[actionKey];
        if (!action) { return false; }
        let settings = {...action.settings};
        for (const [settingKey, setting] of Object.entries(settings)) {
            if (setting.hasOwnProperty('optionsLoader')) {
                let parsed_options = await agent[setting.optionsLoader]();
                setting.options = parsed_options;
            }
        }
        console.log(settings)
        return settings;
    }

    async getCommandDetails(agentKey, actionKey, values) {
        console.log(`[AgentRegistry] getting command details for ${agentKey}:${actionKey}`);
        let agent = this.agents[agentKey];
        if (!agent) { return false; }
        let action = agent.agentOutputs[actionKey];
        if (!action) { return false; }
        if(!action.hasOwnProperty('infoRenderHandler')) {
            return '';
        }
        return await agent[action.infoRenderHandler](values);
    }

    getAllAgentDetails() {
        console.log(`[AgentRegistry] getting details for all agents`);
        let agentDetails = {};
        for (const [key, agent] of Object.entries(this.agents)) {
            let agentItem = {
                key: agent.agentKey,
                label: agent.agentLabel,
                name: agent.agentName,
                description: agent.agentDescription,
                settings: agent.agentSettings,
                settingsForm: agent.agentSettingsForm
            }
            agentDetails[agent.agentKey] = agentItem;
        }
        return agentDetails;
    }

    getAgentSettings(agentKey) {
        let agent = this.agents[agentKey];
        if (!agent) { return undefined; }
        var agentData = this.appData.read('agents');
        if(!agentData.hasOwnProperty(agent.agentKey)) return undefined;
        return agentData[agent.agentKey];
    }

}