<template>
  <div class="script-container" v-if="commandList && actionTypeList">
    <div class="d-flex mb-4">
      <div class="section-title">
        <h6>Commands for <em>{{script.name}}</em></h6>
      </div>
      <div class="ml-auto">

        <v-select
            class="mb-2"
            style="min-width: 240px;"
            placeholder="Select an Action Type"
            @input="handleSelectNewAction"
            :options="Object.values(actionTypeList).filter(actionType => !getActionTypeHidden(actionType))"
            :reduce="actionType => `${actionType.agent}:${actionType.key}`"
        >
          <template v-slot:option="option">
            <div class="d-flex">
              <div class="text-left" style="overflow-x:hidden; text-overflow:ellipsis; white-space:nowrap">
                <small class="cc-fs-sm" >{{ option.label }}</small><br />
                <small class="cc-fs-sm cc-fc-w400" >{{ option.category }}</small>
              </div>
            </div>
          </template>
        </v-select>
      </div>
      <div>
        <button :disabled="selectedActionId === ''" class="btn btn-teal add-btn" @click="uploadCommand()">New Command</button>
      </div>
    </div>
    <div class="script-timeline" v-if="commandTimeline && actionTypeList">
      <ul>
        <li v-for="(commands, timeCode) in commandTimeline"
            :id="'ctlc'+timeCode"
            :key="'scmdt_'+timeCode+commandListKey"
            :style="`left: calc( (100% * (${timeCode} / ${Math.max(...Object.values(commandList).map(o => parseInt(o.delay)))})) - 8px);`"
            v-b-tooltip.hover.html="getTimelineTooltip(timeCode)"
        >
        </li>
      </ul>
    </div>
    <div class="action-list inner scrollable">
      <ul class="asset-list with-endcap">
        <li v-for="(command, commandKey) in commandList" :key="'scmd_'+commandKey+commandListKey">
          <div class="asset-endcap">
            <span>{{command.delay}}</span>ms
          </div>
          <div class="asset-heading">
            <div class="asset-title">
              {{ actionTypeList[command.action].label }}
            </div>
            <div class="asset-subtitle">
              {{ actionTypeList[command.action].category }}
            </div>
          </div>
          <div class="asset-details" v-html="command.__details"></div>
          <div class="asset-actions">
            <a v-if="!getCommandEditDisabled(command)" @click="editCommand(commandKey)" v-b-tooltip.hover.bottom.viewport="'Edit'"><i class="fa-solid fa-pen-to-square clickable" ></i></a>
            <a @click="removeCommand(commandKey)" v-b-tooltip.hover.bottom.viewport="'Remove'"><i class="fa-solid fa-trash-can clickable" ></i></a>
          </div>
        </li>
      </ul>

      <div class="section-panel mt-3" v-if="commandList && Object.keys(commandList).length < 1">
        <div class="section-heading">
          <div class="section-title">
            <h5>No Commands defined for this script</h5>
            <span class="cc-fs-sm">Add some commands to react to the action!</span>
          </div>
        </div>
      </div>
    </div>
    <CommandForm
        ref="editCommand"
        :scriptId="script.name"
        :triggerId="triggerId"
        :eventSettingList="eventSettingList"
        @finish-edit="finishEditCommand"
    ></CommandForm>
  </div>
</template>

<script>
import CommandForm from '@/views/Triggers/Commands/CommandForm.vue'

export default {
  name: 'CommandList',
  props: ['script','triggerId', 'eventSettingList'],
  components: {
    CommandForm
  },
  data : function() {
    return {
      actionTypeList: {},
      commandList: {},
      commandListKey: 0,
      commandTimeline: {},
      libraryUploadHandler: this.$gameData.createTriggerCommand,
      libraryType: "commands",
      libraryName: "command",
      selectedActionId: '',
      selectedAction: {},
    }
  },
  methods: {
    listActionTypes() {
      this.$set(this, "actionTypeList", null);
      this.$forceUpdate();
      this.$gameData.getActionTypes().then((result) => {
        this.$set(this, "actionTypeList", result);
      });
    },
    handleSelectNewAction(value) {
      if(!value) {
        this.selectedActionId = '';
        this.selectedAction = {};
        return;
      }
      let [agent , action] = value.split(':');
      this.setSelectedAction(agent, action);
    },
    setSelectedAction(agent, action) {
      console.log('setting selected action', agent, action);
      let key = `${agent}:${action}`;
      this.selectedActionId = key;
      if(key) {
        this.selectedAction = {
          agent: agent,
          action: action
        };
      }
      console.log(this.selectedActionId);
    },
    listCommands() {
      this.$set(this, "commandList", {});
      this.$set(this, "commandTimeline", {});
      this.$forceUpdate();
      this.$gameData.read(`triggers.${this.triggerId}.scripts.${this.script.name}.commands`).then((result) => {
        let commands = Object.values(result);
        commands.sort(function(a,b) {
          return parseInt(a.delay) - parseInt(b.delay);
        });
        commands.forEach((command) => {
          this.$gameData.getCommandDetails(command.agent, command.action, command.settings).then((parsedInfo) => {
            command.__details = parsedInfo;
            this.$set(this.commandList, command.id, command);
            if(!this.commandTimeline.hasOwnProperty(command.delay)) {
              this.$set(this.commandTimeline, command.delay, {});
            }
            this.$set(this.commandTimeline[command.delay], command.id, command);
            this.commandListKey++;
          });
        });

      });
    },
    uploadCommand() {
      this.libraryUploadHandler(this.triggerId, this.script.name, this.selectedAction.agent, this.selectedAction.action).then((result) => {
        if(result.success) {
          this.$set(this.commandList, result.item.id, result.item);
          this.commandListKey++;
          this.selectedActionId = '';
          this.selectedAction = {};
          this.editCommand(result.item.id);
        }
      });
    },
    removeCommand(commandId) {
      if(confirm(`are you sure you want to remove this ${this.libraryName}?`)) {
        this.$delete(this.commandList, commandId);
        this.$gameData.delete(`triggers.${this.triggerId}.scripts.${this.script.name}.commands.${commandId}`).then((success) => {
          this.commandListKey++;
          this.listCommands();
        });
      }
    },
    editCommand(commandId) {
      this.$refs['editCommand'].open(commandId);
    },
    finishEditCommand() {
      this.listCommands();
    },
    getTimelineTooltip(timeCode) {
      let html = `<div><strong>${timeCode}ms:</strong></div>`;
      for (const [key, command] of Object.entries(this.commandTimeline[timeCode])) {
        html = html + `<div>${this.actionTypeList[command.action].label}</div>`;
      }
      return html;
    },
    getActionTypeOptionDisabled(actionType) {
      console.log('at',actionType);
      if(actionType.requireAgentConnection === true) {
        return this.$agentStatus.getStatus(actionType.agent).status !== 'connected';
      }
      return false;
    },
    getActionTypeHidden(actionType) {
      console.log('at',actionType);
      let isDisabled = this.$agentStatus.getStatus(actionType.agent).status === 'disabled';
      let isDisconnected = this.$agentStatus.getStatus(actionType.agent).status !== 'connected';
      if(actionType.requireAgentConnection === true) {
       return isDisabled || isDisconnected;
      }
      return isDisabled;
    },
    getCommandEditDisabled(command) {
      let actionType = this.actionTypeList[command.action];
      return this.getActionTypeOptionDisabled(actionType);
    },
  },
  mounted() {
    this.listActionTypes();
    this.listCommands();
  }
}
</script>