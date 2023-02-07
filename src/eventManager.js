module.exports = class EventManager {
    constructor(agentRegistry) {
        this.agentRegistry = agentRegistry;
        this.appData = this.agentRegistry.appData;
        this.gameData = this.agentRegistry.gameData;
    }

    handleOutputAction(agentKey,actionKey,values) {
        let agent = this.agentRegistry.getAgent(agentKey);
        if (!agent) { return false; }

        let agentStatus = this.agentRegistry.getAgentStatus(agentKey);
        if(agentStatus !== "connected") { return false; }

        if (!agent.agentOutputs.hasOwnProperty(actionKey)) { return false; }
        console.log('[EventManager] Handling Output Action ' + agentKey + '.' + actionKey)
        return agent.agentOutputs[actionKey].handler(values);
    }

    handleInputTrigger(agentKey,triggerKey,script,values) {
        let agent = this.agentRegistry.getAgent(agentKey);
        if (!agent) { return false; }

        let agentStatus = this.agentRegistry.getAgentStatus(agentKey);
        if(agentStatus !== "connected") { return false; }

        if (!agent.agentInputs.hasOwnProperty(triggerKey)) { return false; }

        console.log('[EventManager] Handling Input Trigger ' + agentKey + '.' + actionKey)

        //verify script is valid for agent
        //Look for enabled events in the loaded game that match the agent ang trigger key
            //For each one found,check the event's conditions against the provided values
                //For any that match, pull up the matching script
                //Activate each action in the script
    }
}