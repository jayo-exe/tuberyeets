

module.exports = class EventManager {
    constructor(agentRegistry) {
        this.agentRegistry = agentRegistry;
        this.appData = this.agentRegistry.appData;
        this.gameData = this.agentRegistry.gameData;
        this.eventData = this.gameData.eventData;
    }

    log(...messages) {
        console.group(`${new Date().toISOString()} [EventManager]`);
        for (const message of messages) {
            this.log(message);
        }
        console.groupEnd();
    }

    handleOutputAction(agentKey,actionKey,values) {
        let agent = this.agentRegistry.getAgent(agentKey);
        if (!agent) { return false; }

        let agentStatus = this.agentRegistry.getAgentStatus(agentKey);
        if(agentStatus !== "connected") { return false; }

        if (!agent.agentOutputs.hasOwnProperty(actionKey)) { return false; }
        this.log('Handling Outgoing Action ' + agentKey + '.' + actionKey)
        return agent[agent.agentOutputs[actionKey].handler](values);
    }

    handleInputTrigger(agentKey,eventKey,scriptName,parameters) {
        let agent = this.agentRegistry.getAgent(agentKey);
        if (!agent) { return false; }

        let agentStatus = this.agentRegistry.getAgentStatus(agentKey);
        if(agentStatus !== "connected") { return false; }

        if (!agent.agentInputs.hasOwnProperty(eventKey)) { return false; }

        this.log('Handling Incoming Event ' + agentKey + '.' + eventKey)

        let matchedTriggers = this.eventData.findTriggersForScript(agentKey, eventKey, scriptName, parameters)

        for(const [triggerId, trigger] of Object.entries(matchedTriggers)) {
            let triggerMeta = {
                agent_key: agentKey,
                event_key: eventKey,
                trigger_id: triggerId,
                script_name: scriptName,
                parameters: parameters
            }
            this.log('-- Running "' + scriptName + '" script for trigger ' + triggerId)
            let currentScript = trigger.scripts[scriptName];
            for(const [commandKey, command] of Object.entries(currentScript.commands)) {
                this.log(`---- Queuing an action at ${command.delay}ms for script ${scriptName}`,command);
                setTimeout(() => { this.handleOutputAction(command.agent, command.action, {...command.settings, ...{__trigger: triggerMeta}}); }, parseInt(command.delay));
            }
        }
    }
}