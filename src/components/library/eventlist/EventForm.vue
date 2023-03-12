<template>
  <b-modal ref="editActionModal" scrollable size="xl">
    <template #modal-header="{ close }">
      <h5 class="modal-title">Edit Event - <span v-if="itemData">{{ itemData.name }}</span></h5>
      <button type="button" class="close" @click="finishEdit()">×</button>
    </template>
    <template #default>
      <div id="eventActionDetails" v-if="itemData" class="row">
        <div class="col-12 mb-3">
          <div class="input-section">
            <div class="input-details">

            </div>
            <div class="input-settings">

            </div>
          </div>
        </div>
        <div class="col-12 mb-3">
          <div class="output-section">
            <div class="script-selector">

            </div>
            <div class="script-list">
              <div class="script-container">
                <div class="action-list">
                  <table class="action-table">
                    <thead>
                      <th>Time</th>
                      <th>Action</th>
                      <th><!-- Actions --></th>
                    </thead>
                    <tbody>

                    </tbody>
                  </table>
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
    <EventActionForm
        ref="editItem"
        @finish-edit="finishEditAction"
    ></EventActionForm>
  </b-modal>
</template>

<script>

export default {
  name: 'EventForm',
  props: [],
  data : function() {
    return {
      libraryType: "events",
      libraryName: "Event",
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
      });

    },

    updateItem(field) {
      let itemId = this.itemId;
      this.$gameData.update(`${this.libraryType}.${itemId}.${field}`, this.itemData[field]).then((success) => {
        if(!success) console.log(`updateItem failed for ${this.libraryName} ${itemId}`);
      });
    },

    editAction(eventId, scriptId, itemId) {
      this.$refs['editAction'].open(eventId, scriptId, itemId);
    },
    finishEditAction() {
      this.getItemData();
    },
  },
  mounted() {

  }
}
</script>