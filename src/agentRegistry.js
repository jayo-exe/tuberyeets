module.exports = class AgentRegistry {
    constructor() {
        this.agents = [];
        this.getData = function() {};
        this.setData = function(data) {};
    }

    getDataCallback(callback) {
        this.getData = callback;
    }

    setDataCallback(callback) {
        this.setData = callback;
    }

    registerAgent(agent) {
        //add agent to list
        if (this.agents.hasOwnProperty(agent.agentKey)) {
            console.log("[AgentRegistry] cannot register "+agent.agentKey+", the agent is already registered");
            return false;
        }
        this.agents[agent.agentKey] = agent;

        //fetch and apply settings
        var agentSettings = this.agents[agent.agentKey].agentSettings;


        //fetch and add inputs to list
        //fetch and add outputs to list
        //fire agent init routine
    }
}