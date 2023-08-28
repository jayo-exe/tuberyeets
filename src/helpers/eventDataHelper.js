const uuid = require('uuid');

module.exports = class EventDataHelper {
    constructor(gameDataHelper) {
        this.gameData = gameDataHelper;
    }

    log(...messages) {
        console.group(`${new Date().toISOString()} [EventDataHelper]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

    findTriggersForScript(agentKey, eventKey, scriptName, parameters) {
        let agent = this.gameData.agentRegistry.getAgent(agentKey);
        if(!agent) return false;
        if(!agent.agentInputs.hasOwnProperty(eventKey)) return false;

        let itemsFound = {}

        let data = this.gameData.getAllData();
        for(const [key, trigger] of Object.entries(data.triggers)) {
            if(trigger.agent === agentKey & trigger.event === eventKey) {
                let parametersMatch = true;
                for(const [settingName, settingValue] of Object.entries(parameters)) {
                    if(trigger.settings.hasOwnProperty(settingName) && trigger.settings[settingName] !== settingValue) {
                        parametersMatch = false;
                    }
                    if(!trigger.scripts.hasOwnProperty(scriptName)) {
                        parametersMatch = false;
                    }
                }
                if(parametersMatch) {
                    itemsFound[key] = { ...trigger};
                }
            }
        }

        return itemsFound;
    }

    createTrigger(agentKey,eventKey) {
        let agent = this.gameData.agentRegistry.getAgent(agentKey);
        if(!agent) {
            this.log(`Agent "${agentKey}" not found!`);
            return false;
        }
        if(!agent.agentInputs.hasOwnProperty(eventKey)) {
            this.log(`Input "${eventKey}" not found in Agent "${agentKey}"!`);
            return false;
        }
        let event = agent.agentInputs[eventKey];

        let triggerId = uuid.v1();
        let trigger = {
            'id': triggerId,
            'agent': agentKey,
            'event': eventKey,
            'settings': {},
            'scripts': {},
            'enabled': true,
            'name': 'New Trigger'
        }

        event.settings.forEach((setting) => {
            if(setting.settable) {
                trigger.settings[setting.key] = (setting.hasOwnProperty('default') ? setting.default: null);
            }
        });

        event.triggerScripts.forEach((script) => {
            trigger.scripts[script] = {'name': script, 'commands': {}};
        });

        this.log('trigger to make: ', trigger);

        this.gameData.update(`triggers.${triggerId}`, trigger, true);
        return this.gameData.read(`triggers.${triggerId}`);
    }

    updateTriggerDetails(triggerId, triggerDetails) {
        if(!this.gameData.has(`triggers.${triggerId}`)) return false;

        if(triggerDetails.hasOwnProperty('name')) {
            this.gameData.update(`triggers.${triggerId}.name`, triggerDetails.name);
        }
        if(triggerDetails.hasOwnProperty('enabled')) {
            this.gameData.update(`triggers.${triggerId}.enabled`, triggerDetails.enabled);
        }
        if(triggerDetails.hasOwnProperty('settings')) {
            this.gameData.update(`triggers.${triggerId}.settings`, { ...triggerDetails.settings});
        }


        return this.gameData.read(`triggers.${triggerId}`);
    }

    destroyTrigger(triggerId) {
        return this.gameData.delete(`triggers.${triggerId}`);
    }

    findTriggerCommand(triggerId, scriptName, commandId) {
        return this.gameData.read(`triggers.${triggerId}.scripts.${scriptName}.commands.${commandId}`);
    }

    createTriggerCommand(triggerId, scriptName, agentKey, actionKey) {
        let agent = this.gameData.agentRegistry.getAgent(agentKey);
        if(!agent) return false;
        if(!agent.agentOutputs.hasOwnProperty(actionKey)) return false;
        let action = agent.agentOutputs[actionKey];

        if(!this.gameData.has(`triggers.${triggerId}`)) {
            return false;
        }


        if(!this.gameData.has(`triggers.${triggerId}.scripts.${scriptName}`)) {
            return false;
        }

        let commandId = uuid.v1();
        let command = {
            'id': commandId,
            'agent': agentKey,
            'action': actionKey,
            'delay': 0,
            'settings': {}
        }

        action.settings.forEach((setting) => {
            command.settings[setting.key] = (setting.hasOwnProperty('default') ? setting.default: null);
        });

        this.gameData.update(`triggers.${triggerId}.scripts.${scriptName}.commands.${commandId}`, command, true);

        return this.gameData.read(`triggers.${triggerId}.scripts.${scriptName}.commands.${commandId}`);
    }

    updateTriggerCommandDetails(triggerId, scriptName, commandId, commandDetails) {

        if(!this.findTriggerCommand(triggerId, scriptName, commandId)) {
            return false;
        }

        if(actionDetails.hasOwnProperty('delay')) {
            this.gameData.update(`triggers.${triggerId}.scripts.${scriptName}.commands.${commandId}.delay`, commandDetails.delay);
        }
        if(actionDetails.hasOwnProperty('settings')) {
            this.gameData.update(`triggers.${triggerId}.scripts.${scriptName}.commands.${commandId}.settings`, commandDetails.settings);
        }

        return this.gameData.read(`triggers.${triggerId}.scripts.${scriptName}.commands.${commandId}`);
    }

    destroyTriggerCommand(triggerId, scriptName, commandId) {
        if(!this.findTriggerCommand(triggerId, scriptName, commandId)) {
            return false;
        }

        return this.gameData.delete(`triggers.${triggerId}.scripts.${scriptName}.commands.${commandId}`);
    }
}