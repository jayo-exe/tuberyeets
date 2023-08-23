<template>
  <b-modal ref="editModal" scrollable size="md">
    <template #modal-header="{ close }">
      <h5 class="modal-title">Edit Item - <span v-if="itemData">{{ itemData.location }}</span></h5>
      <button type="button" class="close" @click="finishEdit()"><i class="fa-solid fa-xmark"></i></button>
    </template>
    <template #default class="d-flex flex-column">
      <div id="imageDetails" v-if="itemData" class="row flex-grow-1" style="max-height: calc(100% - 32px)">
        <div class="col-12 d-flex flex-row">
          <section class="input-section mr-3 flex-shrink-1" style="flex-basis: 50%">
            <div class="input-details">
              <div class="form-group">
                <label class="form-label cc-fs-sm">Item Name</label>
                <input type="text" class="form-input d-block w-100" v-model="itemData.name" @input="updateItem('name')">
              </div>
              <div class="form-group">
                <label class="form-label cc-fs-sm">Scale</label>
                <input type="number" class="form-input d-block w-100" min="0" step="0.1" v-model="itemData.scale" @input="updateItem('scale')">
              </div>
              <div class="form-group">
                <label class="form-label cc-fs-sm">Weight</label>
                <input type="range" class="form-input d-block w-100" min="0" max="1" step="0.1" v-model="itemData.weight" @input="updateItem('weight')">
              </div>
              <div class="form-group">
                <label class="form-label cc-fs-sm">Sound</label>
                <v-select v-model="itemData.sound"
                          append-to-body
                          :calculate-position="withPopper"
                          class="mb-2"
                          placeholder="Select a Sound"
                          @input="updateItem('sound')"
                          :options="Object.values(soundList)"
                          label="location"
                          :reduce="sound => sound.id"
                >
                  <template v-slot:option="option">
                    <div class="d-flex">
                      <div class="mr-2 pl-0 ml-n1 text-center">
                        <i class="sound-icon fa-solid fa-volume-high" style="font-size:29px; color: var(--cc-color-w300)"></i>
                      </div>
                      <div class="text-right" style="overflow-x:hidden; text-overflow:ellipsis; white-space:nowrap">
                        <small class="cc-fs-sm" >{{ option.location }}</small>
                      </div>
                    </div>
                  </template>
                </v-select>
              </div>
              <div class="form-group">
                <label class="form-label cc-fs-sm">Volume</label>
                <input class="form-input d-block w-100" type="range" min="0" max="1" step="0.1" v-model="itemData.volume" @input="updateItem('volume')">
              </div>
            </div>
          </section>

          <section class="input-section justify-content-center align-items-center flex-grow-1" style="flex-basis: 50%">
            <img class="imageImage" :src="'file://'+getItemPath(itemData.location)">
          </section>
        </div>

      </div>

    </template>
    <template #modal-footer="{ hide }">
      <button v-if="itemData" class="btn btn-sm btn-blurple add-btn" @click="testCustomItem()">Test Item</button>
      <b-button size="sm" variant="outline-secondary" @click="finishEdit()">
        Close
      </b-button>
    </template>
  </b-modal>


</template>

<script>
import {createPopper} from "@popperjs/core";

export default {
  name: 'ItemForm',
  props: [],
  data : function() {
    return {
      libraryType: "throws",
      libraryName: "Item",
      itemId: null,
      itemData: null,
      soundList: {},
      gameDataPath: '',
      itemListSection: "ItemList"
    }
  },
  methods: {
    open(itemId) {
      this.itemId = itemId;
      this.getItemData();
      this.listSounds();
      this.$refs['editModal'].show();
    },
    finishEdit() {
      this.$refs['editModal'].hide();
      this.$emit("finish-edit");
    },
    getItemPath(filename) {
      return `${this.gameDataPath}/${this.libraryType}/${filename}`;
    },
    getItemData() {
      this.$gameData.read(`${this.libraryType}.${this.itemId}`).then((result) => {
        this.$set(this, "itemData", result);
      });

    },
    listSounds() {
      this.$gameData.read(`impacts`).then((result) => {
        this.$set(this, "soundList", result);
      });
    },
    updateItem(field) {
      let itemId = this.itemId;
      this.$gameData.update(`${this.libraryType}.${itemId}.${field}`, this.itemData[field]).then((success) => {
        if(!success) console.log(`updateItem failed for ${this.libraryName} ${itemId}`);
      });
    },
    testCustomItem() {
      console.log('Testing custom item: ' + this.itemData.id);
      window.ipc.send('TEST_CUSTOM_ITEM', this.itemData.id);
    },
    withPopper(dropdownList, component, { width }) {
      console.log(component.$refs.toggle);
      dropdownList.style.width = width;
      dropdownList.style.zIndex = 999999;
      const popper = createPopper(component.$refs.toggle, dropdownList, {
        placement: 'top',
        modifiers: [
          {
            name: 'toggleClass',
            enabled: true,
            phase: 'write',
            fn({ state }) {
              component.$el.classList.toggle(
                  'drop-up',
                  state.placement === 'top'
              )
            },
          },
        ],
      })

      return () => popper.destroy()
    },
  },
  mounted() {
    this.gameDataPath = this.$gameData.readSync('game_data_path');
  },
}
</script>