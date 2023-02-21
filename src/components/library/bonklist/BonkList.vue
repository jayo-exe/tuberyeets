<template>
  <div v-if="itemList">
    <h2>Bonks</h2>
    <div id="customBonks" class="body-panel">
      <h3>Custom Bonks</h3>
      <button class="btn btn-green add-btn" @click="uploadItem">Add Bonk</button>
      <hr>
      <div id="bonksTable" class="imageTable">
        <table class="listTable">
          <thead>
          <tr>
            <th>Bonk Name</th>
            <th style="width: 200px;">Actions</th>
          </tr>
          </thead>
          <tbody>
            <tr v-for="(bonk, key) in itemList"  :key="'bcb_'+key+listKey">
              <td>
                <p class="imageLabel">{{ bonk.name }}</p>
              </td>
              <td>
                <button class="btn btn-green" @click="editItem(key)">Edit</button>
                <button class="btn btn-blue" @click="testCustomBonk(key)">Test</button>
                <button class="btn btn-red" @click="removeItem(key)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <BonkForm
        ref="editItem"
        @finish-edit="finishEditItem"
    ></BonkForm>
  </div>
</template>

<script>
import isotip from 'isotip';
import BonkForm from '@/components/library/bonklist/BonkForm.vue'

export default {
  name: 'BonkList',
  props: [],
  components: {
    BonkForm
  },
  data : function() {
    return {
      libraryType: 'customBonks',
      libraryName: 'Bonk',
      libraryUploadHandler: this.$gameData.createBonk,
      itemList: null,
      listKey: 0,
      gameDataPath: '',
      editFormSection: "BonkForm",
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
          this.$gameData.clearBonk(itemId);
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

    testCustomBonk(itemId) {
      console.log('Testing custom bonk: ' + itemId);
      window.ipc.send('TEST_CUSTOM_BONK', itemId);
    }
  },
  mounted() {
    isotip.init();
    this.listItems();
  },

}
</script>