<template>
  <div>
    <h2>Items</h2>

    <div id="bonkImages" class="body-panel">
      <h3>Bonk Images</h3>
      <input id="loadImage" type="file" ref="file" accept="image/*" multiple hidden @change="handleNewFiles">
      <button class="btn btn-green add-btn" @click="$refs.file.click()">Add Images</button>
      <hr>
      <div id="imageTable" class="imageTable">
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

        <div v-for="(bonk_item, key) in live_game_data.throws" id="imageRow" class="row" :key="'bi_'+bonk_item.location">
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
            <img class="imageImage img-pxl" :src="'file://'+getThrowsPath(bonk_item.location)" @click="testCustomItem(key)" v-b-tooltip.click.right="'Test'"></img>
            <p class="imageLabel" :title="bonk_item.location">{{ bonk_item.location }}</p>
            <label class="delete">
              <button class="imageRemove" @click="removeItem(key)"></button>
              <img src="ui/x.png" class="checkmark" v-b-tooltip.hover.left="'Remove'"></img>
            </label>
            <div class="imageRowHover"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'ItemList',
  props: ['app_data','app_game','game_data','current_item'],
  data : function() {
    return {
      live_app_data: this.app_data,
      live_game_data: this.game_data,
    }
  },
  methods: {
    getThrowsPath(filename) {
      var dsep = this.live_app_data.sys_sep;
      var path = this.live_game_data.game_data_path + "/throws/" + filename;
      return path.replaceAll("/",dsep);
    },
    getImpactsPath(filename) {
      var dsep = this.live_app_data.sys_sep;
      var path = this.live_game_data.game_data_path + "/impacts/" + filename;
      return path.replaceAll("/",dsep);
    },
    editItem(item_index) {
      this.$emit("edit-item",item_index);
    },
    removeItem(item_index) {
      if(confirm("are you sure you want to remove this Item?")) {
        var item_image = this.live_game_data.throws[item_index].location;
        this.live_game_data.throws.splice(item_index,1);
      }
    },
    updateGameData() {
      this.$emit("update-game-data",this.live_game_data);
    },
    handleNewFiles(event) {
      var file_list = event.target.files;
      for (let i = 0; i < file_list.length; i++) {
        let file = file_list.item(i);
        console.log('sending upload message for ' + file.name);
        window.ipc.send("UPLOAD_THROW", {game_id: this.app_game.id, file_name: file.name, file_path: file.path});
      }
    },
    handleIncludeCheckbox(event,item_index) {
      var isChecked = event.target.checked;
      if(isChecked) {
        this.enableItem(item_index);
      } else {
        this.disableItem(item_index);
      }
    },
    handleIncludeAllCheckbox(event) {
      var isChecked = event.target.checked;
      for (var i = 0; i < this.live_game_data.throws.length; i++)
        if (isChecked == true) {
          this.enableItem(i);
        } else {
          this.disableItem(i);
        }
    },
    itemIsEnabled(item_index) {
      if (this.live_game_data.throws[item_index].enabled === true)
      {
        return true;
      }
      return false;
    },
    allItemsEnabled() {
      var allIncluded = true;
      for (var i = 0; i < this.live_game_data.throws.length; i++) {
        if(this.itemIsEnabled(i) == false) {
          allIncluded = false;
        }
      }
      return allIncluded;
    },
    enableItem(item_index) {
      if(!this.itemIsEnabled(item_index)) {
        this.live_game_data.throws[item_index].enabled = true;
      }
    },
    disableItem(item_index) {
      if(this.itemIsEnabled(item_index)) {
        this.live_game_data.throws[item_index].enabled = false;
      }
    },
    testCustomItem(item_index) {
      console.log('Testing custom item: ' + item_index);
      let item = this.live_game_data.throws[item_index];
      window.ipc.send('TEST_CUSTOM_ITEM', item.location);
    }
  },
  components: {
    //HelloWorld
  },
  mounted() {
  },
  watch: {
    app_data: {
      handler: function() { this.live_app_data = this.app_data},
      deep: true
    },
    game_data: {
      handler: function() { this.live_game_data = this.game_data},
      deep: true
    },
    live_game_data: {
      handler: function(newVal, oldVal) {
        this.updateGameData();
      },
      deep: true
    }
  },
}
</script>