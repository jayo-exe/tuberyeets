<template>
  <div class="d-flex">
    <section id="overlayImages" style="flex: 1">
      <div class="section-heading">
        <div class="section-title">
          <h3 class="cc-h5">Overlay Sounds</h3>
          <span></span>
        </div>
        <div class="ml-auto">
          <input id="loadSound" type="file" ref="file" accept="audio/*" multiple hidden @change="uploadItem">
          <button class="btn btn-teal add-btn" @click="$refs.file.click()">Add Sounds</button>
        </div>
      </div>

      <div id="soundTable" class="inner scrollable">
        <div class="selectAll">
          <div>
            <p><span v-if="!allItemsEnabled()">Select</span><span v-else>Deselect</span> All</p>
            <label>
              <input type="checkbox" class="imageEnabled" :checked="allItemsEnabled()" @change="handleIncludeAllCheckbox">
            </label>
          </div>
        </div>
        <ul v-if="itemList" class="asset-list with-endcap" style="margin-top: 56px; ">
          <li v-for="(itemGroupImpact, key) in itemList" :key="'bim_'+itemGroupImpact.id+listKey" style="grid-template-columns: 4em 1fr 10em;">
            <div class="asset-endcap">
              <i class="sound-icon fa-solid fa-volume-high" style="font-size: 29px; color: var(--cc-color-w300)"></i>
            </div>
            <div class="asset-heading">
              <div class="asset-title">
                {{ itemGroupImpact.location }}
              </div>
              <div class="asset-subtitle">
                <input type="checkbox" class="imageEnabled" :checked="itemIsEnabled(key)" @change="handleIncludeCheckbox($event,key)">
              </div>
            </div>
            <div class="asset-details d-flex flex-row" style="align-items:center;">
              <input class="soundVolume mt-2" type="range" min="0" max="1" step="0.01" v-model="itemList[key].volume" @change="() => {updateItem(key, 'volume')}">
            </div>
            <div class="asset-actions" style="align-items:center; justify-content: center;">
              <a @click="removeItem(key)" v-b-tooltip.hover.bottom.viewport="'Remove'"><i class="fa-solid fa-trash-can clickable" ></i></a>
            </div>
          </li>
        </ul>

        <div class="section-panel mt-3" v-if="itemList && Object.keys(itemList).length < 1">
          <div class="section-heading">
            <div class="section-title">
              <h5>No Sounds defined for this game</h5>
              <span class="cc-fs-sm">Add some Sounds to spice up your Items and Groups!</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  </div>
</template>

<script>


export default {
  name: 'SoundList',
  props: [],
  data : function() {
    return {
      libraryType: 'sounds',
      libraryName: 'Sound',
      libraryUploadHandler: this.$gameData.uploadSound,
      itemList: {},
      listKey: 0,
      gameDataPath: '',
    }
  },
  methods: {
    getItemPath(filename) {
      return `${this.gameDataPath}/${this.libraryType}/${filename}`;
    },
    listItems() {
      this.$gameData.read(`${this.libraryType}`).then((result) => {
        this.$set(this, "itemList", result);
        this.listKey++;
      });
    },
    uploadItem(event) {
      var file_list = event.target.files;
      for (let i = 0; i < file_list.length; i++) {
        let file = file_list.item(i);
        console.log(`sending upload message for ${this.libraryName} ${file.name}`);
        this.libraryUploadHandler(file.path, file.name).then((result) => {
          if(result.success) {
            this.$set(this.itemList, result.item.id, result.item);
            this.listKey++;
          }
        });
      }
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
      for (var i = 0; i < this.itemList.length; i++)
        if (isChecked == true) {
          this.enableItem(i);
        } else {
          this.disableItem(i);
        }
    },
    itemIsEnabled(itemId) {
      if (this.itemList[itemId].enabled === true)
      {
        return true;
      }
      return false;
    },
    allItemsEnabled() {
      var allIncluded = true;
      for (var i = 0; i < this.itemList.length; i++) {
        if(this.itemIsEnabled(i) == false) {
          allIncluded = false;
        }
      }
      return allIncluded;
    },
    enableItem(itemId) {
      if(!this.itemIsEnabled(itemId)) {
        this.itemList[itemId].enabled = true;
        this.updateItem(itemId, 'enabled');
      }
    },
    disableItem(itemId) {
      if(this.itemIsEnabled(itemId)) {
        this.itemList[itemId].enabled = false;
        this.updateItem(itemId, 'enabled');
      }
    }
  },
  components: {
    //HelloWorld
  },
  mounted() {
    this.listItems();
    this.gameDataPath = this.$gameData.readSync('game_data_path');
    this.$emit('lock-game-change');
  }
}
</script>