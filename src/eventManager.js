

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
        console.log('[EventManager] Handling Outgoing Action ' + agentKey + '.' + actionKey)
        return agent[agent.agentOutputs[actionKey].handler](values);
    }

    handleInputTrigger(agentKey,eventKey,scriptName,parameters) {
        let agent = this.agentRegistry.getAgent(agentKey);
        if (!agent) { return false; }

        let agentStatus = this.agentRegistry.getAgentStatus(agentKey);
        if(agentStatus !== "connected") { return false; }

        if (!agent.agentInputs.hasOwnProperty(eventKey)) { return false; }

        console.log('[EventManager] Handling Incoming Event ' + agentKey + '.' + eventKey)

        let matchedTriggers = this.eventData.findTriggersForScript(agentKey, eventKey, scriptName, parameters)

        for(const [triggerId, trigger] of Object.entries(matchedTriggers)) {
            console.log('[EventManager] -- Running "' + scriptName + '" script for trigger ' + triggerId)
            let currentScript = trigger.scripts[scriptName];
            for(const [commandKey, command] of Object.entries(currentScript.commands)) {
                console.log(`[EventManager] ---- Queuing an action at ${command.delay}ms for script ${scriptName}`,command);
                setTimeout(() => { this.handleOutputAction(command.agent, command.action, command.settings); }, parseInt(command.delay));
            }
        }
    }
}