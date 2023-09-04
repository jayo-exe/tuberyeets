<template>
  <div class="d-flex">
    <section id="events" style="flex: 1">
      <div class="section-heading">
        <div class="section-title">
          <h3 class="cc-h5">Triggers</h3>
          <span></span>
        </div>
        <div class="ml-auto">
          <select @change="handleSelectNewEvent">
            <option :value="null" >Select an Event Type</option>
            <optgroup v-for="(eventTypeGroup) in eventTypeList" :key="'evtg_'+listKey" :label="eventTypeGroup.name">
              <option v-for="(eventType) in eventTypeGroup.options"
                      :key="'evto_'+listKey"
                      :value="`${eventType.agent}:${eventType.key}`">
                {{ `${eventTypeGroup.name}: ${eventType.label}` }}
              </option>
            </optgroup>
          </select>
          <button :disabled="selectedTypeId === null" class="btn btn-teal add-btn" @click="uploadItem">New Trigger</button>
        </div>
      </div>

      <div id="eventsTable" class="inner scrollable" v-if="eventTypeList && itemList">
        <ul class="asset-list">
          <li v-for="(trigger, key) in itemList" :key="'ev_'+listKey">
            <div class="asset-heading">
              <div class="asset-title">
                {{ eventTypeList[trigger.agent].options[trigger.event].label }}
              </div>
              <div class="asset-subtitle">
                {{ eventTypeList[trigger.agent].name }}
              </div>
            </div>
            <div class="asset-details">
              <span>{{ trigger.name }}</span>
            </div>
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
      itemList: null,
      eventTypeList: null,
      selectedTypeId: null,
      selectedType: {},
      listKey: 0,
      gameDataPath: '',
      editFormSection: "TriggerForm",
    }
  },
  methods: {
    listItems() {
      this.$set(this, "itemList", null);
      this.$forceUpdate();
      this.$gameData.read(`${this.libraryType}`).then((result) => {
        this.$set(this, "itemList", result);
        this.listKey++;
      });
    },
    uploadItem() {
      console.log(`sending create message for ${this.libraryName}`);
      this.libraryUploadHandler(this.selectedType.agent, this.selectedType.event).then((result) => {
        if(result.success) {
          console.log('event create good!');
          console.log(result.item);
          this.$set(this.itemList, result.item.id, result.item);
          this.listKey++;
          this.selectedTypeId = null;
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

    handleSelectNewEvent(event) {
      let [agent , trigger] = event.target.value.split(':');
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