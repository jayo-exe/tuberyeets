<template>
  <b-modal ref="editModal" scrollable size="xl">
    <template #modal-header="{ close }">
      <h5 class="modal-title">Edit Event - <span v-if="itemData">{{ itemData.name }}</span></h5>
      <button type="button" class="close" @click="finishEdit()"><i class="fa-solid fa-xmark"></i></button>
    </template>
    <template #default class="d-flex flex-column">
      <div id="eventActionDetails" v-if="itemData && eventTypeList" class="row flex-grow-1">
        <div class="col-12 d-flex flex-column">
          <section class="input-section trigger-form-grid mb-3">
            <div class="input-details">
              <div class="form-group">
                <label class="form-label">Trigger Name</label>
                <input type="text" min="0" step="1" class="triggerName form-input" v-model="itemData.name" @input="updateItem('name')">
              </div>
              <div class="form-group">
                <label class="form-label">Event</label>
                <p style="margin: 0">{{ `${eventTypeList[itemData.agent].name}: ${eventTypeList[itemData.agent].options[itemData.event].label}` }}</p>
              </div>
            </div>
            <div class="input-settings">
              <div v-for="(setting, settingKey) in eventSettingList" >
                <div v-if="setting.settable" class="form-group" >
                  <label class="form-label">{{ `${setting.label}` }}</label>
                  <template v-if="setting.type === 'groupedList'">
                    <select class="form-input" v-model="itemData.settings[setting.key]" @change="updateItem('settings')">
                      <optgroup v-for="(settingOptionGroup, groupIndex) in setting.options" :key="'evtg_'+groupIndex" :label="settingOptionGroup.group">
                        <option v-for="(settingOption, optionIndex) in settingOptionGroup.items" :key="'evto_'+optionIndex" :value="settingOption.value">
                          {{ `${settingOptionGroup.group}: ${settingOption.label}` }}
                        </option>
                      </optgroup>
                    </select>
                  </template>
                </div>
              </div>
            </div>
          </section>
          <section class="output-section flex-grow-1">
            <div class="script-selector">

            </div>
            <div class="script-list">
              <b-tabs content-class="mt-3">
                <b-tab v-for="(script, scriptKey) in itemData.scripts" :key="`script-tab-${scriptKey}`" :title="script.name">
                  <CommandList
                      :triggerId="itemId"
                      :eventSettingList="eventSettingList"
                      :script="script"
                  ></CommandList>
                </b-tab>
              </b-tabs>
            </div>
          </section>
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
import CommandList from '@/views/Triggers/Commands/CommandList.vue'
export default {
  name: 'TriggerForm',
  props: [],
  components: {
    CommandList
  },
  data : function() {
    return {
      eventTypeList: {},
      eventSettingList: {},
      actionTypeList: {},
      commandList: {},
      commandListKey: 0,
      libraryUploadHandler: this.$gameData.createTriggerCommand,
      libraryType: "triggers",
      libraryName: "trigger",
      selectedActionId: null,
      selectedAction: {},
      itemId: null,
      itemData: null,
    }
  },
  methods: {
    open(itemId) {
      this.itemId = itemId;
      this.getItemData();
      this.$refs['editModal'].show();
    },

    finishEdit() {
      this.$refs['editModal'].hide();
      this.$emit("finish-edit");
    },

    getItemData() {
      this.$gameData.read(`${this.libraryType}.${this.itemId}`).then((result) => {
        this.$set(this, "itemData", result);
        this.listEventSettings();
      });

    },

    updateItem(field) {
      let itemId = this.itemId;
      console.log(`[Trigger List] updating field ${this.libraryType}.${itemId}.${field} to ${this.itemData[field]}`);
      this.$gameData.update(`${this.libraryType}.${itemId}.${field}`, this.itemData[field]).then((success) => {
        if(!success) console.log(`updateItem failed for ${this.libraryName} ${itemId}`);
      });
    },
    listEventTypes() {
      this.$set(this, "eventTypeList", null);
      this.$forceUpdate();
      this.$gameData.getEventTypes().then((result) => {
        this.$set(this, "eventTypeList", result);
      });
    },
    listEventSettings() {
      this.$set(this, "eventSettingList", null);
      this.$forceUpdate();
      this.$gameData.getEventSettings(this.itemData.agent, this.itemData.event).then((result) => {
        this.$set(this, "eventSettingList", result);
      });
    }
  },
  mounted() {
    this.listEventTypes();
  }
}
</script>