<template>
  <div>
    <h2>Select Windup Sounds for Bonk</h2>
    <span class="btn btn-red back-btn" @click="setSection('BonkForm')">Back</span>
    <div id="windupSounds" class="body-panel">
      <h3>Windup Sounds</h3>
      <input id="loadWindupSound" ref="file" type="file" accept="audio/*" multiple hidden @change="handleNewFiles">
      <button class="btn btn-green add-btn" @click="$refs.file.click()">Add Sounds</button>
      <hr>
      <div id="windupSoundTable" class="imageTable">
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

        <div id="windupSoundRow" v-for="(bonk_windup, key) in live_game_data.customBonks[current_bonk].windupSounds" class="row windupSoundRow" :key="'bw_'+key">
          <div class="imageRowInner">
            <label class="checkbox">
              <input type="checkbox" class="imageEnabled" :checked="itemIsEnabled(key)" @change="handleIncludeCheckbox($event,key)">
              <div class="checkHover"></div>
              <img src="ui/checkmark.png" class="checkmark">
            </label>
            <p class="imageLabel" :title="bonk_windup.location">{{ bonk_windup.location }}</p>
            <input class="soundVolume" type="range" min="0" max="1" step="0.1" v-model="live_game_data.customBonks[current_bonk].windupSounds[key].volume">
            <label class="delete">
              <button class="imageRemove" @click="removeItem(key)"></button>
              <img src="ui/x.png" class="checkmark"></img>
            </label>
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
  name: 'BonkWindups',
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
    updateGameData() {
      this.$emit("update-game-data",this.live_game_data);
    },
    handleNewFiles(event) {
      var file_list = event.target.files;
      for (let i = 0; i < file_list.length; i++) {
        let file = file_list.item(i);
        console.log('sending upload message for ' + file.name);
        window.ipc.send("UPLOAD_WINDUP", {game_id: this.app_game.id, file_name: file.name, current_bonk: this.current_bonk, file_path: file.path});
      }
    },
    removeItem(item_index) {
      if(confirm("are you sure you want to remove this Windup?")) {
        this.live_game_data.customBonks[this.current_bonk].windupSounds.splice(item_index,1);
      }
    },
    getWindupsPath(filename) {
      var dsep = this.live_app_data.sys_sep;
      var path = this.live_game_data.game_data_path + "/windups/" + filename;
      var path = this.live_game_data.game_data_path + "/windups/" + filename;
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
      for (var i = 0; i < this.live_game_data.customBonks[this.current_bonk].windupSounds.length; i++)
        if (isChecked == true) {
          this.enableItem(i);
        } else {
          this.disableItem(i);
        }
    },
    itemIsEnabled(item_index) {
      if (this.live_game_data.customBonks[this.current_bonk].windupSounds[item_index].enabled === true)
      {
        return true;
      }
      return false;
    },
    allItemsEnabled() {
      var allIncluded = true;
      for (var i = 0; i < this.live_game_data.customBonks[this.current_bonk].windupSounds.length; i++) {
        if(this.itemIsEnabled(i) == false) {
          allIncluded = false;
        }
      }
      return allIncluded;
    },
    enableItem(item_index) {
      if(!this.itemIsEnabled(item_index)) {
        this.live_game_data.customBonks[this.current_bonk].windupSounds[item_index].enabled = true;
      }
    },
    disableItem(item_index) {
      if(this.itemIsEnabled(item_index)) {
        this.live_game_data.customBonks[this.current_bonk].windupSounds[item_index].enabled = false;
      }
    }
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