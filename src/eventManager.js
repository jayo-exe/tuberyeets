

module.exports = class EventManager {
    constructor(agentRegistry) {
        this.agentRegistry = agentRegistry;
        this.appData = this.agentRegistry.appData;
        this.gameData = this.agentRegistry.gameData;
        this.eventData = this.gameData.eventData;
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

    handleInputTrigger(agentKey,triggerKey,scriptName,parameters) {
        let agent = this.agentRegistry.getAgent(agentKey);
        if (!agent) { return false; }

        let agentStatus = this.agentRegistry.getAgentStatus(agentKey);
        if(agentStatus !== "connected") { return false; }

        if (!agent.agentInputs.hasOwnProperty(triggerKey)) { return false; }

        console.log('[EventManager] Handling Input Trigger ' + agentKey + '.' + triggerKey)

        let matchedEvents = this.eventData.findEventsForTrigger(agentKey, triggerKey, scriptName, parameters)

        for(const [eventId, event] of Object.entries(matchedEvents)) {
            console.log('[EventManager] Running "' + scriptName + '" script for event ' + eventId)
            let currentScript = event.scripts[scriptName];
            for(const [actionKey, action] of Object.entries(currentScript.actions)) {
                setTimeout(() => { this.handleOutputAction(action.agent, action.agentAction, action.settings); }, parseInt(action.delay));
            }
        }
    }
}