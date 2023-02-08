const uuid = require('uuid');

module.exports = class EventDataHelper {
    constructor(gameDataHelper) {
        this.gameData = gameDataHelper;
    }

    findEventsForTrigger(agentKey, triggerKey, scriptName, parameters) {
        let agent = this.gameData.agentRegistry.getAgent(agentKey);
        if(!agent) return false;
        if(!agent.agentInputs.hasOwnProperty(triggerKey)) return false;

        let itemsFound = {}

        let data = this.gameData.getAllData();
        for(const [key, event] of Object.entries(data.events)) {
            if(event.agent === agentKey & event.trigger === triggerKey) {
                let parametersMatch = true;
                for(const [settingName, settingValue] of Object.entries(parameters)) {
                    if(event.settings.hasOwnProperty(settingName) && event.settings[settingName] !== settingValue) {
                        parametersMatch = false;
                    }
                    if(!event.scripts.hasOwnProperty(scriptName)) {
                        parametersMatch = false;
                    }
                }
                if(parametersMatch) {
                    itemsFound[key] = { ...event};
                }
            }
        }

        return itemsFound;
    }

    createEvent(agentKey,triggerKey) {
        let agent = this.gameData.agentRegistry.getAgent(agentKey);
        if(!agent) return false;
        if(!agent.agentInputs.hasOwnProperty(triggerKey)) return false;
        let trigger = agent.agentInputs[triggerKey];

        let eventId = uuid.v1();
        let event = {
            'id': eventId,
            'agent': agentKey,
            'trigger': triggerKey,
            'settings': {},
            'scripts': {},
            'enabled': true,
            'name': 'New Event'
        }

        trigger.settings.forEach((setting) => {
            if(setting.settable) {
                event.settings[setting.key] = (setting.hasOwnProperty('default') ? setting.default: null);
            }
        });

        trigger.eventScripts.forEach((script) => {
            event.scripts[script.key] = {'name': script.key, 'actions': {}};
        });

        let data = this.gameData.getAllData();
        data.events[eventId] = { ...event};
        this.gameData.setAllData(data);
        this.gameData.saveData();

        return data.events[eventId];
    }

    updateEventDetails(eventId, eventDetails) {
        let data = this.gameData.getAllData();
        if(!data.events.hasOwnProperty(eventId)) {
            return false;
        }
        if(eventDetails.hasOwnProperty('name')) {
            data.events[eventId].name = eventDetails.name;
        }
        if(eventDetails.hasOwnProperty('enabled')) {
            data.events[eventId].enabled = eventDetails.enabled;
        }
        if(eventDetails.hasOwnProperty('settings')) {
            data.events[eventId].settings = { ...eventDetails.settings};
        }

        this.gameData.setAllData(data);
        this.gameData.saveData();

        return data.events[eventId];
    }

    destroyEvent(eventId) {
        let data = this.gameData.getAllData();
        if(!data.events.hasOwnProperty(eventId)) {
            return false;
        }

        delete data.events[eventId];
        this.gameData.setAllData(data);
        this.gameData.saveData();

        return true;
    }

    findEventAction(eventId, scriptName, actionId) {
        let data = this.gameData.getAllData();
        if(!data.events.hasOwnProperty(eventId)) {
            return false;
        }
        if(!data.events[eventId].scripts.hasOwnProperty(scriptName)) {
            return false;
        }
        if(!data.events[eventId].scripts[scriptName].actions.hasOwnProperty(actionId)) {
            return false;
        }
        return data.events[eventId].scripts[scriptName].actions[actionId];
    }

    createEventAction(eventId, scriptName, agentKey, actionKey) {
        let agent = this.gameData.agentRegistry.getAgent(agentKey);
        if(!agent) return false;
        if(!agent.agentOutputs.hasOwnProperty(actionKey)) return false;
        let agentAction = agent.agentOutputs[actionKey];

        let data = this.gameData.getAllData();
        if(!data.events.hasOwnProperty(eventId)) {
            return false;
        }
        if(!data.events[eventId].scripts.hasOwnProperty(scriptName)) {
            return false;
        }

        let actionId = uuid.v1();
        let action = {
            'id': actionId,
            'agent': agentKey,
            'agentAction': actionKey,
            'delay': 0,
            'settings': {}
        }

        agentAction.settings.forEach((setting) => {
            action.settings[setting.key] = (setting.hasOwnProperty('default') ? setting.default: null);
        });

        data = this.gameData.getAllData();
        data.events[eventId].scripts[scriptName].actions[actionId] = { ...action};
        this.gameData.setAllData(data);
        this.gameData.saveData();

        return data.events[eventId].scripts[scriptName].actions[actionId];
    }

    updateEventActionDetails(eventId, scriptName, actionId, actionDetails) {
        let data = this.gameData.getAllData();
        if(!this.findEventAction(eventId, scriptName, actionId)) {
            return false;
        }

        if(actionDetails.hasOwnProperty('delay')) {
            data.events[eventId].scripts[scriptName].actions[actionId].delay = actionDetails.delay
        }
        if(actionDetails.hasOwnProperty('settings')) {
            data.events[eventId].scripts[scriptName].actions[actionId].settings = { ...actionDetails.settings};
        }

        this.gameData.setAllData(data);
        this.gameData.saveData();

        return data.events[eventId].scripts[scriptName].actions[actionId];
    }

    destroyEventAction(eventId, scriptName, actionId) {
        if(!this.findEventAction(eventId, scriptName, actionId)) {
            return false;
        }
        let data = this.gameData.getAllData();
        delete data.events[eventId].scripts[scriptName].actions[actionId];
        this.gameData.setAllData(data);
        this.gameData.saveData();

        return true;
    }
}