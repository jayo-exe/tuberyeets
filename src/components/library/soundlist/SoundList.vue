<template>
  <div v-if="itemList">
    <h2>Sounds</h2>

    <div id="bonkSounds" class="body-panel">
      <h3>Sound Library</h3>
      <input id="loadSound" type="file" ref="file" accept="audio/*" multiple hidden @change="uploadItem">
      <button class="btn btn-green add-btn" @click="$refs.file.click()">Add Sounds</button>
      <hr>
      <div id="soundTable" class="imageTable">
        <div class="selectAll">
          <div>
            <p><span v-if="!allItemsEnabled()">Select</span><span v-else>Deselect</span> All</p>
            <label class="checkbox">
              <input type="checkbox" class="imageEnabled" :checked="allItemsEnabled()" @change="handleIncludeAllCheckbox">
              <div class="checkHover"></div>
              <img src="ui/checkmark.png" class="checkmark">
            </label>
          </div>
        </div>
        <table class="listTable">
          <thead>
            <tr>
              <th style="text-align:center;">Default</th>
              <th>Name</th>
              <th>Volume</th>
              <th style="text-align:center;">Delete?</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(bonkImpact, key) in itemList" :key="'bim_'+bonkImpact.id+listKey">
              <td>
                <label class="checkbox">
                  <input type="checkbox" class="imageEnabled" :checked="itemIsEnabled(key)" @change="handleIncludeCheckbox($event,key)">
                  <div class="checkHover"></div>
                  <img src="ui/checkmark.png" class="checkmark">
                </label>
              </td>
              <td>
                <p class="imageLabel" :title="bonkImpact.location">{{ bonkImpact.location }}</p>
              </td>
              <td class="volume-column">
                <label class="cogwheel">
                  <img src="ui/speaker.png" class="checkmark" title="Volume" v-b-tooltip.hover.right="'Volume'"></img>
                </label>
                <input class="soundVolume" type="range" min="0" max="1" step="0.1" v-model="itemList[key].volume" @input="() => {updateItem(key, 'volume')}">
              </td>
              <td>
                <label class="delete">
                  <button class="imageRemove" @click="removeItem(key)"></button>
                  <img src="ui/x.png" class="checkmark" v-b-tooltip.hover.left="'Remove'"></img>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.volume-column .cogwheel {
  float: left;
}
.volume-column .soundVolume {
  width: calc(100% - 32px);
  float: left;
  margin-top: 8px;
}
</style>

<script>


export default {
  name: 'SoundList',
  props: [],
  data : function() {
    return {
      libraryType: 'impacts',
      libraryName: 'Sound',
      libraryUploadHandler: this.$gameData.uploadImpact,
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
  }
}
</script>