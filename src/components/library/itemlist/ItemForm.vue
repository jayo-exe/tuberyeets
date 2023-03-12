<template>
  <b-modal ref="editModal" size="xl">
    <template #modal-header="{ close }">
      <h5 class="modal-title">Edit Item - <span v-if="itemData">{{ itemData.location }}</span></h5>
      <button type="button" class="close" @click="finishEdit()">×</button>
    </template>
    <template #default>
      <div id="imageDetails" v-if="itemData">
        <div id="imageDetailsInner">
          <img class="imageImage" :src="'file://'+getItemPath(itemData.location)">
          <div id="imageSettings">
            <div id="imageSettings1">
              <div class="imageDetailsShadow">
                <div class="imageDetailsInner">
                  <div class="settingsTable">
                    <p>Scale <i class="fa fa-info-circle"
                                v-b-tooltip.hover.left="'The relative size of the object compared to the input image'"
                    ></i></p>
                    <input type="number" class="imageScale" min="0" step="0.1" v-model="itemData.scale" @input="updateItem('scale')">
                    <p>Weight <i class="fa fa-info-circle"
                                 v-b-tooltip.hover.left="'This determines how much force is applied to the vTube model on impact'"
                    ></i></p>
                    <input type="range" class="imageWeight" min="0" max="1" step="0.1" v-model="itemData.weight" @input="updateItem('weight')">
                    <p>Volume <i class="fa fa-info-circle"
                                 v-b-tooltip.hover.left="'The volume of the impact sound'"
                    ></i></p>
                    <input class="imageSoundVolume" type="range" min="0" max="1" step="0.1" v-model="itemData.volume" @input="updateItem('volume')">
                  </div>
                </div>
              </div>
            </div>
            <div id="imageSettings2">
              <div class="imageDetailsShadow">
                <div class="imageDetailsInner">
                  <div class="settingsTable">
                    <p>Sound</p>
                    <div>
                      <select class="imageSoundName" v-model="itemData.sound" @change="updateItem('sound')">
                        <option value="">(Use default sounds)</option>
                        <option v-for="(bonkImpact, key) in soundList" :value="bonkImpact.id">{{ bonkImpact.location }}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>
    <template #modal-footer="{ hide }">
      <button v-if="itemData" class="btn btn-blurple add-btn" @click="testCustomItem()">Test Item</button>
      <b-button size="sm" variant="outline-secondary" @click="finishEdit()">
        Close
      </b-button>
    </template>
  </b-modal>


</template>

<script>
// @ is an alias to /src
//import HelloWorld from '@/components/HelloWorld.vue'

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
  },
  mounted() {
    this.gameDataPath = this.$gameData.readSync('game_data_path');
  },
}
</script>