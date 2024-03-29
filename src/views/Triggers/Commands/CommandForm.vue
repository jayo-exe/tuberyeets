<template>
  <b-modal ref="editModal" scrollable size="md">
    <template #modal-header="{ close }">
      <h5 class="modal-title">Edit Command</h5>
      <button type="button" class="close" @click="finishEdit()"><i class="fa-solid fa-xmark"></i></button>
    </template>
    <template #default>
      <div id="eventActionDetails" v-if="commandData && actionTypeList" class="row">
        <div class="col-12 mb-3">
          <div class="input-section trigger-form-grid">
            <div class="input-details">
              <div class="form-group">
                <label class="form-label">Delay</label>
                <input type="number" min="0" step="1" class="form-input" v-model="commandData.delay" @input="updateCommand('delay')">
              </div>
              <div class="form-group">
                <label class="form-label">Action Type</label>
                <p style="margin: 0">{{ `${actionTypeList[commandData.action].category}: ${actionTypeList[commandData.action].label}` }}</p>
              </div>
            </div>
            <div class="input-settings">
              <div v-for="(setting, settingName) in actionSettingList" >
                <div v-if="(setting && shouldDisplayField(setting))" class="form-group" >
                  <label class="form-label">{{ `${setting.label}` }}</label>
                  <template v-if="setting.type === 'list'">
                    <v-select v-model="commandData.settings[setting.key]"
                              append-to-body
                              :clearable="false"
                              :calculate-position="$withPopper"
                              class="mb-2"
                              placeholder="Select an Option"
                              @input="updateCommand('settings')"
                              :options="Object.values(setting.options)"
                              label="label"
                              :reduce="option => option.value"
                    ></v-select>
                  </template>
                  <template v-else-if="setting.type === 'toggle'">
                    <input type="checkbox" class="form-input" v-model="commandData.settings[setting.key]" @change="updateCommand('settings')" >
                  </template>
                  <template v-else-if="setting.type === 'number'">
                    <input type="number" :step="setting.step ?? 1" :min="setting.min ?? ''" :max="setting.max ?? ''" class="form-input" v-model="commandData.settings[setting.key]" @input="updateCommand('settings')">
                  </template>
                  <template v-else-if="setting.type === 'text'">
                    <input type="text" class="form-input" v-model="commandData.settings[setting.key]" @input="updateCommand('settings')">
                  </template>
                  <template v-else-if="setting.type === 'parameter'">
                    <v-select v-model="commandData.settings[setting.key]"
                              append-to-body
                              :clearable="false"
                              :calculate-position="$withPopper"
                              class="mb-2"
                              placeholder="Select an Option"
                              @input="updateCommand('settings')"
                              :options="Object.values(eventSettingList)"
                              label="label"
                              :reduce="option => option.key"
                    ></v-select>
                  </template>
                  <template v-else>
                    <input type="text" class="form-input" v-model="commandData.settings[setting.key]" @input="updateCommand('settings')">
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #modal-footer="{ hide }">
      <b-button size="sm" variant="outline-secondary" @click="finishEdit()">
        Close
      </b-button>
    </template>
  </b-modal>
</template>

<script>
export default {
  name: 'CommandForm',
  props: ['triggerId','scriptId', 'eventSettingList'],
  data : function() {
    return {
      actionTypeList: {},
      actionSettingList: {},
      commandId: null,
      commandData: null
    }
  },
  methods: {
    open(commandId) {
      this.commandId = commandId;
      this.getCommandData();
      this.$refs['editModal'].show();
    },
    finishEdit() {
      this.$refs['editModal'].hide();
      this.$emit("finish-edit");
    },

    getCommandData() {
      this.$gameData.read(`triggers.${this.triggerId}.scripts.${this.scriptId}.commands.${this.commandId}`).then((result) => {
        this.$set(this, "commandData", result);
        this.listActionSettings();
      });

    },

    shouldDisplayField(setting) {
      if(setting.hasOwnProperty('showIfToggled')) {
        if(this.commandData.settings.hasOwnProperty(setting.showIfToggled)) {
          return !!this.commandData.settings[setting.showIfToggled];
        }
      }
      if(setting.hasOwnProperty('hideIfToggled')) {
        if(this.commandData.settings.hasOwnProperty(setting.hideIfToggled)) {
          return !this.commandData.settings[setting.hideIfToggled];
        }
      }

      return true;
    },

    updateCommand(field) {
      let itemId = this.itemId;
      console.log(`[Command Form] updating field triggers.${this.triggerId}.scripts.${this.scriptId}.commands.${this.commandId}.${field} to ${this.commandData[field]}`);
      this.$gameData.update(`triggers.${this.triggerId}.scripts.${this.scriptId}.commands.${this.commandId}.${field}`, this.commandData[field]).then((success) => {
        if(!success) console.log(`updateCommand failed for command ${itemId}`);
      });
    },

    listActionTypes() {
      this.$set(this, "actionTypeList", {});
      this.$forceUpdate();
      this.$gameData.getActionTypes().then((result) => {
        this.$set(this, "actionTypeList", result);
      });
    },
    listActionSettings() {
      this.$set(this, "actionSettingList", {});
      this.$forceUpdate();
      this.$gameData.getActionSettings(this.commandData.agent, this.commandData.action).then((result) => {
        this.$set(this, "actionSettingList", result);
      });
    }
  },
  mounted() {
    this.listActionTypes();
  }
}
</script>