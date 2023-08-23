<template>
  <div class="script-container">
    <div class="d-flex mb-4">
      <div class="section-title">
        <h6>Commands for <em>{{script.name}}</em></h6>
      </div>
      <div class="ml-auto">
        <select @change="handleSelectNewAction">
          <option :value="null" >Select an Action</option>
          <optgroup v-if="!getActionTypeGroupHidden(gindex)" v-for="(actionTypeGroup, gindex) in actionTypeList" :key="'actg_'+gindex+commandListKey" :label="actionTypeGroup.name">
            <option v-for="(actionType, aindex) in actionTypeGroup.options"
                    :key="'acto_'+aindex+commandListKey"
                    :value="`${actionType.agent}:${actionType.key}`"
                    :disabled="getActionTypeOptionDisabled(actionType)"
                    :test-attr="$agencyStatus.getStatus(actionType.agent).status"
            >

              {{ `${actionTypeGroup.name}: ${actionType.label}` }}
            </option>
          </optgroup>
        </select>
        <button :disabled="selectedActionId === null" class="btn btn-teal add-btn" @click="uploadCommand()">New Command</button>
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
    <div class="action-list">
      <ul class="asset-list with-endcap">
        <li v-for="(command, commandKey) in commandList" :key="'scmd_'+commandKey+commandListKey">
          <div class="asset-endcap">
            <span>{{command.delay}}</span>ms
          </div>
          <div class="asset-heading">
            <div class="asset-title">
              {{ actionTypeList[command.agent].options[command.action].label }}
            </div>
            <div class="asset-subtitle">
              {{ actionTypeList[command.agent].name }}
            </div>
          </div>
          <div class="asset-details" v-html="command.__details"></div>
          <div class="asset-actions">
            <a v-if="!getCommandEditDisabled(command)" @click="editCommand(commandKey)" v-b-tooltip.hover.bottom.viewport="'Edit'"><i class="fa-solid fa-pen-to-square clickable" ></i></a>
            <a @click="removeCommand(commandKey)" v-b-tooltip.hover.bottom.viewport="'Remove'"><i class="fa-solid fa-trash-can clickable" ></i></a>
          </div>
        </li>
      </ul>
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
      selectedActionId: null,
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
    handleSelectNewAction(event) {
      let [agent , action] = event.target.value.split(':');
      this.setSelectedAction(agent, action);
    },
    setSelectedAction(agent, action) {
      let key = `${agent}:${action}`;
      this.selectedActionId = key;
      if(key) {
        this.selectedAction = {
          agent: agent,
          action: action
        };
      }
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
          this.selectedActionId = null;
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
        console.log('command',command);
        console.log('atl',this.actionTypeList);
        html = html + `<div>${this.actionTypeList[command.agent].options[command.action].label}</div>`;
      }
      return html;
    },
    getActionTypeOptionDisabled(actionType) {
      console.log('at',actionType);
      if(actionType.requireAgentConnection === true) {
        return this.$agencyStatus.getStatus(actionType.agent).status !== 'connected';
      }
      return true;
    },
    getActionTypeGroupHidden(agent) {
      return this.$agencyStatus.getStatus(agent).status === 'disabled';
    },
    getCommandEditDisabled(command) {
      let actionType = this.actionTypeList[command.agent].options[command.action];
      return this.getActionTypeOptionDisabled(actionType);
    },
  },
  mounted() {
    this.listActionTypes();
    this.listCommands();
  }
}
</script>