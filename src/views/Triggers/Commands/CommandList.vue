<template>
  <div class="script-container">
    <div class="d-flex mb-4">
      <div class="section-title">
        <h6>Commands for <em>{{script.name}}</em></h6>
      </div>
      <div class="ml-auto">
        <select @change="handleSelectNewAction">
          <option :value="null" >Select an Action</option>
          <optgroup v-for="(actionTypeGroup, gindex) in actionTypeList" :key="'actg_'+gindex+commandListKey" :label="actionTypeGroup.name">
            <option v-for="(actionType, aindex) in actionTypeGroup.options"
                    :key="'acto_'+aindex+commandListKey"
                    :value="`${actionType.agent}:${actionType.key}`">
              {{ `${actionTypeGroup.name}: ${actionType.label}` }}
            </option>
          </optgroup>
        </select>
        <button :disabled="selectedActionId === null" class="btn btn-teal add-btn" @click="uploadCommand()">New Command</button>
      </div>
    </div>
    <div class="action-list">
      <table class="listTable">
        <thead>
        <tr>
          <th>Delay</th>
          <th>Action</th>
          <th style="width: 9rem;"><!-- Actions --></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(command, commandKey) in commandList" :key="'scmd_'+commandKey+commandListKey">
          <td>{{command.delay}}ms</td>
          <td>{{ `${actionTypeList[command.agent].name}: ${actionTypeList[command.agent].options[command.action].label}` }}</td>
          <td class="text-right">
            <button class="btn btn-teal btn-sm" @click="editCommand(commandKey)">Edit</button>
            <button class="btn btn-red btn-sm" @click="removeCommand(commandKey)">Delete</button></td>
        </tr>
        </tbody>
      </table>
    </div>
    <CommandForm
        ref="editCommand"
        :scriptId="script.name"
        :triggerId="triggerId"
        @finish-edit="finishEditCommand"
    ></CommandForm>
  </div>
</template>

<script>
import CommandForm from '@/views/Triggers/Commands/CommandForm.vue'

export default {
  name: 'CommandList',
  props: ['script','triggerId'],
  components: {
    CommandForm
  },
  data : function() {
    return {
      actionTypeList: {},
      commandList: {},
      commandListKey: 0,
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
      this.$set(this, "commandList", null);
      this.$forceUpdate();
      this.$gameData.read(`triggers.${this.triggerId}.scripts.${this.script.name}.commands`).then((result) => {
        this.$set(this, "commandList", result);
        this.commandListKey++;
      });
    },
    uploadCommand() {
      this.libraryUploadHandler(this.triggerId, this.script.name, this.selectedAction.agent, this.selectedAction.action).then((result) => {
        if(result.success) {
          this.$set(this.commandList, result.item.id, result.item);
          this.commandListKey++;
          this.selectedActionId = null;
          this.selectedAction = {};
          this.listCommands();
        }
      });
    },
    removeCommand(commandId) {
      if(confirm(`are you sure you want to remove this ${this.libraryName}?`)) {
        this.$delete(this.commandList, commandId);
        this.$gameData.delete(`triggers.${this.triggerId}.scripts.${this.script.name}.commands.${commandId}`).then((success) => {
          this.commandListKey++;
        });
      }
    },
    editCommand(commandId) {
      this.$refs['editCommand'].open(commandId);
    },
    finishEditCommand() {
      this.listCommands();
    },
  },
  mounted() {
    this.listActionTypes();
    this.listCommands();
  }
}
</script>