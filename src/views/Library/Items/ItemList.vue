<template>
  <div v-if="itemList" class="d-flex">
    <section id="overlayImages" style="flex: 1">
      <div class="section-heading">
        <div class="section-title">
          <h3 class="cc-h5">Overlay Items</h3>
          <span></span>
        </div>
        <div class="ml-auto">
          <input id="loadImage" type="file" ref="file" accept="image/*" multiple hidden @change="uploadItem">
          <button class="btn btn-teal add-btn" @click="$refs.file.click()">Add Images</button>
        </div>
      </div>

      <div id="imageTable" class="imageTable inner scrollable">
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

        <div v-for="(overlayItem, key) in itemList" id="imageRow" class="row" :key="'bi_'+overlayItem.id+listKey">
          <div class="imageRowInner">
            <label class="checkbox">
              <input type="checkbox" class="imageEnabled" :checked="itemIsEnabled(key)" @change="handleIncludeCheckbox($event,key)">
              <div class="checkHover"></div>
              <img src="ui/checkmark.png" class="checkmark">
            </label>
            <label class="cogwheel">
              <button class="imageDetails" @click="editItem(key)">Details</button>
              <img src="ui/cog.png" class="checkmark" v-b-tooltip.hover.right="'Edit'">
            </label>
            <img class="imageImage img-pxl" :src="'file://'+getItemPath(overlayItem.location)" @click="testCustomItem(overlayItem.id)" v-b-tooltip.click.right="'Test'"></img>
            <p class="imageLabel" :title="overlayItem.name">{{ overlayItem.name }}</p>
            <label class="delete">
              <button class="imageRemove" @click="removeItem(key)"></button>
              <img src="ui/x.png" class="checkmark" v-b-tooltip.hover.left="'Remove'"></img>
            </label>
            <div class="imageRowHover"></div>
          </div>
        </div>
      </div>
    </section>
    <ItemForm
        ref="editItem"
        @finish-edit="finishEditItem"
    ></ItemForm>

  </div>

</template>

<script>
import ItemForm from '@/views/Library/Items/ItemForm.vue'

export default {
  name: 'ItemList',
  props: ['current_item'],
  components: {
    ItemForm
  },
  data : function() {
    return {
      libraryType: 'throws',
      libraryName: 'Item',
      libraryUploadHandler: this.$gameData.uploadThrow,
      itemList: {},
      soundList: {},
      listKey: 0,
      gameDataPath: '',
      editFormSection: "ItemForm",
    }
  },
  methods: {
    getItemPath(filename) {
      return `${this.gameDataPath}/${this.libraryType}/${filename}`;
    },
    listItems() {
      this.$set(this, "itemList", null);
      this.$forceUpdate();
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

    editItem(itemId) {
      this.$refs['editItem'].open(itemId);
    },
    finishEditItem() {
      this.listItems();
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
    },
    testCustomItem(itemId) {
      console.log('Testing custom item: ' + itemId);
      let item = this.itemList[itemId];
      window.ipc.send('TEST_CUSTOM_ITEM', item.id);
    }
  },
  mounted() {
    this.listItems();
    this.gameDataPath = this.$gameData.readSync('game_data_path');
    this.$emit('lock-game-change');
  }
}
</script>