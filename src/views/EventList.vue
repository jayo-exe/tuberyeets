<template>
  <div>
    <h2>Triggers</h2>

    <div id="events" class="body-panel">
      <h3>Events</h3>
      <div class="event-selector">
        <select @change="handleSelectNewEvent">
          <optgroup v-for="(eventTypeGroup) in eventTypeList" :key="'evtg_'+listKey" :label="eventTypeGroup.name">
            <option v-for="(eventType) in eventTypeGroup.options" :key="'evto_'+listKey" :value="eventType.key">
              {{ `${eventTypeGroup.name}: ${eventType.label}` }}
            </option>
          </optgroup>
        </select>
        <button class="btn btn-teal add-btn" @click="uploadItem">Add Event</button>
      </div>
      <hr>
      <div id="eventsTable" class="imageTable">
        <table class="listTable">
          <thead>
          <tr>
            <th>Name</th>
            <th>Event Type</th>
            <th style="width: 140px;">Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(event, key) in itemList" :key="'ev_'+listKey">
            <td>
              <p class="imageLabel">{{ event.name }}</p>
            </td>
            <td>
              <p style="margin: 0">{{ `${eventTypeList[event.agent].name}: ${eventTypeList[event.agent].options[event.trigger].label}` }}</p>
            </td>
            <td>
              <button class="btn btn-teal" @click="editItem(key)">Edit</button>
              <button class="btn btn-red" @click="removeItem(key)">Delete</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
    <EventForm
        ref="editItem"
        @finish-edit="finishEditItem"
    ></EventForm>
  </div>
</template>

<script>
import EventForm from '@/components/library/eventlist/EventForm.vue'
import isotip from "isotip";

export default {
  name: 'EventList',
  props: [],
  components: {
    EventForm,
  },
  data : function() {
    return {
      libraryType: 'events',
      libraryName: 'Event',
      libraryUploadHandler: this.$gameData.createEvent,
      itemList: null,
      eventTypeList: null,
      selectedTypeId: null,
      selectedType: {},
      listKey: 0,
      gameDataPath: '',
      editFormSection: "EventForm",
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
      this.libraryUploadHandler(this.selectedType.agent, this.selectedType.trigger).then((result) => {
        if(result.success) {
          console.log('event create good!');
          this.$set(this.itemList, result.item.id, result.item);
          this.listKey++;
          this.selectedTypeId = null;
          this.selectedType = {};
          this.listItems();
        }
      });
    },
    updateItem(itemId, field) {
      this.$gameData.update(`${this.libraryType}.${itemId}.${field}`, this.itemList[itemId][field]).then((success) => {
        if(!success) console.log(`updateItem failed for ${this.libraryName} ${itemId}`);
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
      let newKey = event.target.value;
      this.selectedTypeId = newKey;
      this.selectedType = {
        agent: this.eventTypeList[newKey].agent,
        trigger: this.eventTypeList[newKey].key
      };
    },
    listEventTypes() {
      this.$set(this, "eventTypeList", null);
      this.$forceUpdate();
      this.$gameData.getEventTypes().then((result) => {
        this.$set(this, "eventTypeList", result);
        this.listKey++;
      });
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