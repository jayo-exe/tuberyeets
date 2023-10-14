const { WebMidi } = require("webmidi");
module.exports = class MidiAgent {

    constructor(agentRegistry) {

        this.controlStates = {};
        this.noteStates = {};
        this.midiClient = new MidiClient(this);
        this.agentRegistry = agentRegistry;
        this.agentName = 'MIDI';
        this.agentKey = 'midi';
        this.agentLabel = 'MIDI';
        this.agentDescription = "Activate Triggers based on input from a MIDI Controller";

        this.agentSettingsForm = 'DefaultSettings';
        this.agentSettings = [
            {
                key: "enabled",
                label: "Enabled",
                type: "toggle",
                settable: false,
                default: false
            },
            {
                key: "inputDeviceName",
                label: "Input Device",
                help: "The MIDI Device from which TuberYeets will receive inputs",
                type: "text",
                settable: true,
                default: ''
            },
            {
                key: "outputDeviceName",
                label: "Output Device",
                help: "The MIDI Device to which TuberYeets will receive inputs, optional",
                type: "text",
                settable: true,
                default: ''
            },
        ];
        this.agentInputs = {
            midiNote: new MidiNoteInput(this),
            midiControl: new MidiControlInput(this),
            midiEncoder: new MidiEncoderInput(this)
        };
        this.agentOutputs = {
        };

    }

    agentRegistered() {
        this.log("running agentRegistered()...");
        if(this.agentRegistry.getAgentFieldData(this,'enabled')) {
            this.agentEnabled();
        }
    }

    agentEnabled() {
        this.log("Agent Enabled.");
        this.midiClient.startMidi();
    }

    agentDisabled() {
        //TODO:: shut down the midi connector
        this.log("Agent Disabled.");
        this.midiClient.stopMidi();
    }

    agentStatus() {
        if(!this.agentRegistry.getAgentFieldData(this,'enabled')) {
            return 'disabled';
        }

        if(this.midiClient.midiProblem) {
            return 'disconnected';
        }
        if(this.midiClient.midiReady) {
            return 'connected';
        }
        return 'waiting';
    }

    log(...messages) {
        console.group(`${new Date().toISOString()} [MidiAgent]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

};

class MidiClient {
    constructor(agent) {
        this.agent = agent;
        this.midiInput = null;
        this.midiOutput = null;
        this.midiReady = false;
        this.midiProblem = false;
        this.noteStates = {};
        this.controlStates = {};
    }

    startMidi() {
        WebMidi
            .enable({sysex: true})
            .then(() => this.onEnabled())
            .catch(err => {
                this.log(`Couldn't enable WebMidi`, err)
                this.midiProblem = true;
            });
    }

    stopMidi() {
        WebMidi
            .disable()
            .then(() => this.onDisabled())
            .catch(err => {
                this.log(`Couldn't disable WebMidi`, err)
                this.midiProblem = true;
            });
    }

    onEnabled() {
        const inputName = this.agent.agentRegistry.getAgentFieldData(this.agent,'inputDeviceName');
        const outputName = this.agent.agentRegistry.getAgentFieldData(this.agent,'outputDeviceName');

        this.midiInput = WebMidi.getInputByName(inputName);
        if(!this.midiInput) {
            this.log(`couldn't get WebMidi Input for ${inputName}`)
            this.midiProblem = true;
            return;
        }

        if(outputName) {
            this.midiOutput = WebMidi.getOutputByName(outputName);
            if(!this.midiOutput) {
                this.log(`couldn't get WebMidi Output for ${inputName}`)
                this.midiProblem = true;
                return;
            }
            this.midiInput.addForwarder(this.midiOutput);
        }

        this.midiInput.addListener("midimessage", (e) => {this.handleMidiMessage(e); });
        this.midiReady = true;
        this.log(`WebMidi Started`)
    }

    onDisabled() {
        this.midiInput = null;
        this.midiOutput = null;
        this.midiReady = false;
        this.midiProblem = false;
        this.log(`WebMidi Stopped`)
    }

    handleMidiMessage(midiMessage) {
        this.log(`got midi message: `, midiMessage.data);
        const data = midiMessage.data;
        const em = this.agent.agentRegistry.eventManager;

        const type = data[0];
        const note = data[1];
        const value = data [2];

        if(type === 144) {
            //note pressed
            this.log(`Note ${note} pressed`);
            this.noteStates[data[1]] = data[2];
            em.handleInputTrigger(this.agent.agentKey, "midiNote","pressed", {noteId: note.toString(), value: value});
        }

        if(type === 128) {
            //note released
            this.log(`Note ${note} released`);
            this.noteStates[data[1]] = data[2];
            em.handleInputTrigger(this.agent.agentKey, "midiNote","released", {noteId: note.toString(), value: value});
        }

        if(type === 176) {
            //control changed
            this.log(`Control ${note} changed`);
            this.controlStates[data[1]] = data[2];
            const encoderChange = (value > 100 ? 'decreased' : 'increased');
            em.handleInputTrigger(this.agent.agentKey, "midiControl","changed", {controlId: note.toString(), value: value});
            em.handleInputTrigger(this.agent.agentKey, "midiEncoder", encoderChange, {controlId: note.toString(), value: value});
        }


    }



    log(...messages) {
        console.group(`${new Date().toISOString()} [MidiAgent > MidiClient]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

}
class MidiNoteInput {
    constructor(agent) {
        this.agent = agent;
        this.gdh = this.agent.agentRegistry.gameData;

        this.key =  'midiNote';
        this.label =  'Midi Note';
        this.description =  'A Midi Note-related input was detected';
        this.settings =  [
            {
                'key': 'noteId',
                'label': 'Note ID',
                'type': 'number',
                'step': '1',
                'default': 1,
                'settable': true
            },
            {
                'key': 'value',
                'label': 'Value',
                'type': 'number',
                'step': '1',
                'max': '127',
                'default': 0,
                'settable': false
            }
        ];
        this.triggerScripts = [
            'pressed', 'released',
        ];
    }

    handleRender(settings) {
        return `<ul>` +
            `<li><strong>Note ID: </strong><span>${settings.noteId}</span></li>` +
            `</ul>`;
    }
}

class MidiControlInput {
    constructor(agent) {
        this.agent = agent;
        this.gdh = this.agent.agentRegistry.gameData;

        this.key =  'midiControl';
        this.label =  'Variable Control Change';
        this.description =  'A Midi control with variable values (such as a slider or a dial) was changed';
        this.settings =  [
            {
                'key': 'controlId',
                'label': 'Control ID',
                'type': 'number',
                'step': '1',
                'default': 1,
                'settable': true
            },
            {
                'key': 'value',
                'label': 'Value',
                'type': 'number',
                'step': '1',
                'max': '127',
                'default': 0,
                'settable': false
            }
        ];
        this.triggerScripts = [
            'changed',
        ];
    }

    handleRender(settings) {
        return `<ul>` +
            `<li><strong>Control ID: </strong><span>${settings.controlId}</span></li>` +
            `</ul>`;
    }
}

class MidiEncoderInput {
    constructor(agent) {
        this.agent = agent;
        this.gdh = this.agent.agentRegistry.gameData;

        this.key =  'midiEncoder';
        this.label =  'Encoder Control Change';
        this.description =  'A Midi control with no variable value (such as a rotary encoder) was changed';
        this.settings =  [
            {
                'key': 'controlId',
                'label': 'Control ID',
                'type': 'number',
                'step': '1',
                'default': 1,
                'settable': true
            },
            {
                'key': 'value',
                'label': 'Value',
                'type': 'number',
                'step': '1',
                'max': '127',
                'default': 0,
                'settable': false
            }
        ];
        this.triggerScripts = [
            'increased', 'decreased'
        ];
    }

    handleRender(settings) {
        return `<ul>` +
            `<li><strong>Control ID: </strong><span>${settings.controlId}</span></li>` +
            `</ul>`;
    }
}