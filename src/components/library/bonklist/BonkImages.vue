<template>
  <div>
    <h2>Select Items for Bonk</h2>
    <span class="btn btn-red back-btn" @click="setSection('BonkForm')">Back</span>
    <div id="bonkImagesCustom" class="body-panel">
      <h3>Bonk Items</h3>
      <input id="loadImageCustom" type="file" ref="file" accept="image/*" multiple hidden @change="handleNewFiles">
      <button class="btn btn-green add-btn" @click="$refs.file.click()">Add Images</button>
      <hr>
      <div id="imageTableCustom" class="imageTable">


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

        <div v-for="(bonk_item, key) in live_game_data.throws" id="imageRowCustom" class="row imageRow" :key="'bi_'+bonk_item.location">
          <div class="imageRowInner">
            <label class="checkbox">
              <input type="checkbox" class="imageEnabled" :checked="itemIsIncluded(key)" @change="handleIncludeCheckbox($event,key)">
              <div class="checkHover"></div>
              <img src="ui/checkmark.png" class="checkmark">
            </label>
            <img class="imageImage" :src="'file://'+getThrowsPath(bonk_item.location)"></img>
            <p class="imageLabel" :title="bonk_item.location">{{ bonk_item.location }}</p>
            <div class="imageRowHover"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
//import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'BonkImages',
  props: ['app_data','app_game','game_data','current_bonk'],
  data : function() {
    return {
      live_app_data: this.app_data,
      live_game_data: this.game_data,
    }
  },
  methods: {
    setSection(section_name) {
      this.$emit("set-section",section_name);
    },
    updateImages() {
      this.$emit("set-game-field",{
        field: `throws`,
        value: this.live_game_data.throws
      });
    },
    handleNewFiles(event) {
      var file_list = event.target.files;
      for (let i = 0; i < file_list.length; i++) {
        let file = file_list.item(i);
        console.log('sending upload message for ' + file.name);
        window.ipc.send("UPLOAD_THROW", {game_id: this.app_game.id, file_name: file.name, file_path: file.path});
      }
    },
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
    itemIsIncluded(item_index) {
      if (this.live_game_data.throws[item_index].customs.includes(this.current_bonk))
      {
        return true;
      }
      return false;
    },
    allItemsIncluded() {
      var allIncluded = true;
      for (var i = 0; i < this.live_game_data.throws.length; i++) {
        if(this.itemIsIncluded(i) == false) {
          allIncluded = false;
        }
      }

      return allIncluded;
    },
    enableItem(item_index) {
      if(!this.itemIsIncluded(item_index)) {
        this.live_game_data.throws[item_index].customs.push(this.current_bonk);
        this.updateImages();
      }
    },
    disableItem(item_index) {
      if(this.itemIsIncluded(item_index)) {
        this.live_game_data.throws[item_index].customs.splice(this.live_game_data.throws[item_index].customs.indexOf(this.current_bonk),1);
        this.updateImages();
      }
    }
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
    }
  }
}
</script>