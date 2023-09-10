<template>
  <div class="d-flex">
    <section id="events" style="flex: 1">
      <div class="section-heading">
        <div class="section-title">
          <h3 class="cc-h5">Triggers</h3>
          <span></span>
        </div>
        <div class="ml-auto">
          <v-select
                    class="mb-2"
                    style="min-width: 240px;"
                    placeholder="Select an Event Type"
                    @input="handleSelectNewEvent"
                    :options="Object.values(eventTypeList)"
                    :reduce="eventType => `${eventType.agent}:${eventType.key}`"
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
        <div class="">
          <button :disabled="selectedTypeId === ''" class="btn btn-teal add-btn" @click="uploadItem">New Trigger</button>
        </div>
      </div>

      <div id="eventsTable" class="inner scrollable" v-if="eventTypeList && itemList">
        <ul class="asset-list">
          <li v-for="(trigger, key) in itemList" :key="'ev_'+key">
            <div class="asset-heading">
              <div class="asset-title">
                <span>{{ trigger.name }}</span>
              </div>
              <div class="asset-subtitle">
                {{ eventTypeList[trigger.event].category }}: {{ eventTypeList[trigger.event].label }}
              </div>
            </div>
            <div class="asset-details" v-html="trigger.__details"></div>
            <div class="asset-actions">
              <a @click="editItem(key)" v-b-tooltip.hover.bottom.viewport="'Edit'"><i class="fa-solid fa-pen-to-square clickable" ></i></a>
              <a @click="removeItem(key)" v-b-tooltip.hover.bottom.viewport="'Remove'"><i class="fa-solid fa-trash-can clickable" ></i></a>
            </div>
          </li>
        </ul>

        <div class="section-panel" v-if="itemList && Object.keys(itemList).length < 1">
          <div class="section-heading">
            <div class="section-title">
              <h5>No Triggers defined for this game</h5>
              <span class="cc-fs-sm">Create some Triggers to turn events to actions!</span>
            </div>
          </div>
        </div>

      </div>
    </section>
    <TriggerForm
        ref="editItem"

        @finish-edit="finishEditItem"
    ></TriggerForm>
  </div>
</template>

<script>
import TriggerForm from '@/views/Triggers/TriggerForm.vue'
import isotip from "isotip";

export default {
  name: 'TriggerList',
  props: ['agent_status'],
  components: {
    TriggerForm,
  },
  data : function() {
    return {
      libraryType: 'triggers',
      libraryName: 'Trigger',
      libraryUploadHandler: this.$gameData.createTrigger,
      itemList: {},
      eventTypeList: {},
      selectedTypeId: '',
      selectedType: {},
      listKey: 0,
      gameDataPath: '',
      editFormSection: "TriggerForm",
    }
  },
  methods: {
    listItems() {
      this.$set(this, "itemList", {});
      this.$forceUpdate();
      this.$gameData.read(`${this.libraryType}`).then((result) => {
        Object.values(result).forEach((trigger) => {
          this.$gameData.getTriggerDetails(trigger.agent, trigger.event, trigger.settings).then((parsedInfo) => {
            trigger.__details = parsedInfo;
            this.$set(this.itemList, trigger.id, trigger);
            this.listKey++;
          });
        });
      });
    },
    uploadItem() {
      console.log(`sending create message for ${this.libraryName}`);
      this.libraryUploadHandler(this.selectedType.agent, this.selectedType.event).then((result) => {
        if(result.success) {
          console.log(result.item);
          this.$set(this.itemList, result.item.id, result.item);
          this.listKey++;
          this.selectedTypeId = '';
          this.selectedType = {};
          this.listItems();
          this.editItem(result.item.id);
        }
      });
    },
    updateItem(itemId, field) {
      console.log(`[Trigger List] updating field ${this.libraryType}.${itemId}.${field} to ${this.itemList[itemId][field]}`);
      this.$gameData.update(`${this.libraryType}.${itemId}.${field}`, this.itemList[itemId][field]).then((success) => {
        if(!success) console.log(`[Trigger List] updateItem failed for ${this.libraryName} ${itemId}`);
        this.listKey++;
      });
    },
    removeItem(itemId) {
      if(confirm(`are you sure you want to remove this ${this.libraryName}?`)) {
        this.$delete(this.itemList, itemId);
        this.$gameData.delete(`${this.libraryType}.${itemId}`).then((success) => {
          this.listKey++;
        });
      }
    },

    handleSelectNewEvent(value) {
      if(!value) {
        console.log('unsetting selected type');
        this.selectedTypeId = '';
        this.selectedType = {};
        return;
      }
      let [agent , trigger] = value.split(':');
      this.setSelectedType(agent, trigger);
    },
    listEventTypes() {
      this.$set(this, "eventTypeList", null);
      this.$forceUpdate();
      this.$gameData.getEventTypes().then((result) => {
        this.$set(this, "eventTypeList", result);
        this.listKey++;
        console.log("Event List GET!");
      });
    },
    setSelectedType(agent, event) {
      console.log('setting selected type',agent, event);
      let key = `${agent}:${event}`;
      this.selectedTypeId = key;
      if(key) {
        this.selectedType = {
          agent: agent,
          event: event
        };
      }
    },
    editItem(itemId) {
      this.$refs['editItem'].open(itemId);
    },
    finishEditItem() {
      this.listItems();
    },
  },
  mounted() {
    this.listItems();
    this.listEventTypes();
    this.$emit('lock-game-change');
  },
}
</script>