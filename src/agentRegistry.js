const EventManager = require('./eventManager');

module.exports = class AgentRegistry {
    constructor(appDataHelper, gameDataHelper) {
        this.agents = {};
        this.inputs = {};
        this.outputs = {};

        this.appData = appDataHelper;
        this.gameData = gameDataHelper;
        this.eventManager = new EventManager(this);
        if(!this.appData.hasFieldData('agents')) {
            console.log("[AgentRegistry] Agent Data store not found! Creating...");
            this.appData.setFieldData('agents', {});
            this.appData.saveData();
        }
    }

    hasAgentFieldData(agent, field) {
        var agentData = this.appData.getFieldData('agents');
        if(!agentData.hasOwnProperty(agent.agentKey)) return false;
        if(!agentData[agent.agentKey].hasOwnProperty(field)) return false;
        return true;
    }

    getAgentFieldData(agent, field) {
        var agentData = this.appData.getFieldData('agents');
        if(!agentData.hasOwnProperty(agent.agentKey)) return undefined;
        if(!agentData[agent.agentKey].hasOwnProperty(field)) return undefined;
        return agentData[agent.agentKey][field];
    }

    setAgentFieldData(agent, field, value) {
        var agentData = this.appData.getFieldData('agents');
        if(!agentData.hasOwnProperty(agent.agentKey)) agentData[agent.agentKey] = {};
        if(!agentData[agent.agentKey].hasOwnProperty(field)) agentData[agent.agentKey][field] = {};
        agentData[agent.agentKey][field] = value;
        console.log("[AgentRegistry] Setting field '"+field+"' for agent " + agent.agentKey + "...");
        return this.appData.setFieldData('agents',agentData);
    }

    registerAgent(agent) {
        console.log("[AgentRegistry] Registering agent " + agent.agentKey + "...");
        //add agent to list
        if (this.agents.hasOwnProperty(agent.agentKey)) {
            console.log("[AgentRegistry] cannot register "+agent.agentKey+", the agent is already registered");
            return false;
        }
        this.agents[agent.agentKey] = agent;

        agent.agentSettings.forEach((setting) => {
            if(!this.hasAgentFieldData(agent, setting.name)) {
                this.setAgentFieldData(agent, setting.name, setting.default);
            }
        });
        this.appData.saveData();

        //fire agent init routine
        console.log("[AgentRegistry] Firing registry routine for agent " + agent.agentKey + "...");
        agent.agentRegistered(this);
    }

    activateAgent(agentKey) {
        let agent = this.agents[agentKey];
        if (!agent) { return false; }
        this.setAgentFieldData(agent,'enabled', true);
        this.appData.saveData();
        agent.agentEnabled();
    }

    deactivateAgent(agentKey) {
        let agent = this.agents[agentKey];
        if (!agent) { return false; }
        this.setAgentFieldData(agent,'enabled', false);
        this.appData.saveData();
        agent.agentDisabled();
    }

    reloadAgent(agentKey) {
        let agent = this.agents[agentKey];
        if (!agent) { return false; }
        this.deactivateAgent(agentKey);
        agent.agentRegistered(this);
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

    saveAppData() {
        return this.appData.saveData();
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



}