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
        <table class="listTable">
          <thead>
          <tr>
            <th>Group Name</th>
            <th style="width: 224px;">Actions</th>
          </tr>
          </thead>
          <tbody>
            <tr v-for="(itemGroup, key) in itemList"  :key="'bcb_'+key+listKey">
              <td>
                <p class="imageLabel">{{ itemGroup.name }}</p>
              </td>
              <td>
                <button class="btn btn-teal" @click="editItem(key)">Edit</button>
                <button class="btn btn-blurple" @click="testItemGroup(key)">Test</button>
                <button class="btn btn-red" @click="removeItem(key)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
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