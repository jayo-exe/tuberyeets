<template>
  <b-modal ref="selectModal" scrollable size="xl">
    <template #modal-header="{ close }">
      <h5 class="modal-title">Select Sounds for Bonk</h5>
      <button type="button" class="close" @click="finishSelect()">×</button>
    </template>
    <template #default>
      <div v-if="itemList" :key="listKey">
        <div id="bonkImagesCustom" class="row">
          <div id="imageTableCustom" class="imageTable col-12">

            <div class="selectAll">
              <div>
                <p><span v-if="!allItemsIncluded()">Select</span><span v-else>Deselect</span> All</p>
                <label class="checkbox">
                  <input type="checkbox" class="imageEnabled" :checked="allItemsIncluded()" @change="handleIncludeAllCheckbox">
                  <div class="checkHover"></div>
                  <img src="ui/checkmark.png" class="checkmark">
                </label>
              </div>
            </div>

            <div v-for="(item, key) in itemList" id="soundRowCustom" class="row imageRow" :key="'bi_'+item.id+listKey">
              <div class="imageRowInner">
                <label class="checkbox">
                  <input type="checkbox" class="imageEnabled" :checked="itemIsIncluded(key)" @change="handleIncludeCheckbox($event,key)">
                  <div class="checkHover"></div>
                  <img src="ui/checkmark.png" class="checkmark">
                </label>
                <label class="cogwheel"></label>
                <p class="imageLabel":title="item.location">{{ item.location }}</p>
                <div class="imageRowHover"></div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </template>
    <template #modal-footer="{ hide }">
      <b-button size="sm" variant="outline-secondary" @click="finishSelect()">
        Close
      </b-button>
    </template>
  </b-modal>

</template>

<script>

export default {
  name: 'BonkSounds',
  props: [],
  data : function() {
    return {
      libraryType: 'impacts',
      libraryName: 'Sound',
      itemList: {},
      bonkId: '',
      soundList: {},
      listKey: 0,
      gameDataPath: '',
    }
  },
  methods: {
    open(bonkId) {
      this.bonkId = bonkId;
      this.listItems();
      this.$refs['selectModal'].show();
    },
    finishSelect() {
      this.$refs['selectModal'].hide();
      this.$emit("finish-select");
    },
    getItemPath(filename) {
      return `${this.gameDataPath}/${this.libraryType}/${filename}`;
    },
    listItems() {
      this.$gameData.read(`${this.libraryType}`).then((result) => {
        this.$set(this, "itemList", result);
        this.listKey++;
      });
    },
    handleIncludeCheckbox(event,itemId) {
      var isChecked = event.target.checked;
      if(isChecked) {
        this.enableItem(itemId);
      } else {
        this.disableItem(itemId);
      }
    },
    handleIncludeAllCheckbox(event) {
      var isChecked = event.target.checked;
      for(const [key, item] of Object.entries(this.itemList)) {
        if (isChecked == true) {
          this.enableItem(key);
        } else {
          this.disableItem(key);
        }
      }
      this.listItems();
    },
    itemIsIncluded(itemId) {
      let customs = this.$gameData.readSync(`${this.libraryType}.${itemId}.customs`);
      if (customs.includes(this.bonkId))
      {
        return true;
      }
      return false;
    },
    allItemsIncluded() {
      let allIncluded = true;
      for(const [key, item] of Object.entries(this.itemList)) {
        if(this.itemIsIncluded(key) == false) {
          allIncluded = false;
        }
      }
      return allIncluded;
    },
    enableItem(itemId) {
      if(!this.itemIsIncluded(itemId)) {
        let customs = this.$gameData.readSync(`${this.libraryType}.${itemId}.customs`);
        customs.push(this.bonkId);
        this.$gameData.update(`${this.libraryType}.${itemId}.customs`, customs);
      }
    },
    disableItem(itemId) {
      if(this.itemIsIncluded(itemId)) {
        let customs = this.$gameData.readSync(`${this.libraryType}.${itemId}.customs`);
        customs.splice(customs.indexOf(this.bonkId),1);
        this.$gameData.update(`${this.libraryType}.${itemId}.customs`, customs);
      }
    }
  },
  mounted() {
    this.listItems();
    this.gameDataPath = this.$gameData.readSync('game_data_path');
  }
}
</script>