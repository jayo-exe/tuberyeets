<template>
  <div >
    <section id="itemGroups" style="flex: 1">
      <div class="section-heading">
        <div class="section-title">
          <h3 class="cc-h5">Item Groups</h3>
          <span></span>
        </div>
        <div class="ml-auto">
          <button class="btn btn-teal add-btn" @click="uploadItem">New Item Group</button>
        </div>
      </div>
      <div id="itemGroupsTable" class="inner scrollable" v-if="itemList">
        <ul class="asset-list with-endcap">
          <li v-for="(itemGroup, key) in itemList"  :key="'bcb_'+key+listKey">
            <div class="asset-endcap">
              <i class="fa-solid fa-cubes-stacked clickable" style="font-size: 29px;" @click="testItemGroup(key)" v-b-tooltip.hover.bottom.viewport="'Test'"></i>
            </div>
            <div class="asset-heading">
              <div class="asset-title">
                {{ itemGroup.name }}
              </div>
              <div class="asset-subtitle">

              </div>
            </div>
            <div class="asset-details d-flex flex-row" style="align-items:center;">
              <ul>
                <li><strong>{{ Object.keys(itemGroup.items).length }}</strong> Items</li>
                <li><strong>{{ itemGroup.sounds.length }}</strong> Sounds</li>
              </ul>
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
              <h5>No Item Groups defined for this game</h5>
              <span class="cc-fs-sm">Combine Items and Sounds into structured Groups for more controlled chaos!</span>
            </div>
          </div>
        </div>

      </div>
    </section>
    <ItemGroupForm
        ref="editItem"
        @finish-edit="finishEditItem"
    ></ItemGroupForm>
  </div>
</template>

<script>
import isotip from 'isotip';
import ItemGroupForm from '@/views/Library/ItemGroups/ItemGroupForm.vue'

export default {
  name: 'ItemGroupList',
  props: [],
  components: {
    ItemGroupForm
  },
  data : function() {
    return {
      libraryType: 'itemGroups',
      libraryName: 'Item Group',
      libraryUploadHandler: this.$gameData.createItemGroup,
      itemList: null,
      listKey: 0,
      gameDataPath: '',
      editFormSection: "ItemGroupForm",
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
      this.libraryUploadHandler().then((result) => {
        console.log(result);
        if(result.success) {
          this.$set(this.itemList, result.item.id, result.item);
          this.listKey++;
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
          this.$gameData.clearItemGroup(itemId);
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

    testItemGroup(itemId) {
      console.log('Testing item group: ' + itemId);
      window.ipc.send('TEST_ITEM_GROUP', itemId);
    }
  },
  mounted() {
    isotip.init();
    this.listItems();
    this.$emit('lock-game-change');
  },

}
</script>