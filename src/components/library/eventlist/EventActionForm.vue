<template>
  <b-modal ref="editActionModal" scrollable size="md">
    <template #modal-header="{ close }">
      <h5 class="modal-title">Edit Action - <span v-if="itemData">{{ itemData.name }}</span></h5>
      <button type="button" class="close" @click="finishEdit()">×</button>
    </template>
    <template #default>
      <div id="eventActionDetails" v-if="itemData" class="row">
        <div class="col-12 mb-3">

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
  name: 'EventForm',
  props: [],
  data : function() {
    return {
      eventId: null,
      scriptId: null,
      itemId: null,
      itemData: null,
    }
  },
  methods: {
    open(eventId, scriptId, itemId) {
      this.eventId = eventId;
      this.scriptId = scriptId;
      this.itemId = itemId;
      this.getItemData();
      this.$refs['editActionModal'].show();
    },

    finishEdit() {
      this.$refs['editActionModal'].hide();
      this.$emit("finish-edit");
    },

    getItemData() {
      this.$gameData.read(`events.${this.eventId}.scripts.${this.scriptId}.actions.${this.itemId}`).then((result) => {
        this.$set(this, "itemData", result);
      });

    },

    updateItem(field) {
      this.$gameData.update(`events.${this.eventId}.scripts.${this.scriptId}.actions.${this.itemId}.${field}`, this.itemData[field]).then((success) => {
        if(!success) console.log(`updateItem failed for Event Action ${this.itemId}`);
      });
    },
  },
  mounted() {

  }
}
</script>