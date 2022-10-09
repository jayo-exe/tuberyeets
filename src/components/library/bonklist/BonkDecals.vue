<template>
  <div>
    <h2>Select Impact Decals for Bonk</h2>
    <span class="btn btn-red back-btn" @click="setSection('BonkForm')">Back</span>
    <div id="impactDecals" class="body-panel">
      <h3>Impact Decals</h3>
      <input id="loadImpactDecal" ref="file" type="file" accept="image/*" multiple hidden @change="handleNewFiles">
      <button class="btn btn-green add-btn" @click="$refs.file.click()">Add Images</button>
      <hr>
      <div id="impactDecalsTable" class="imageTable">
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

        <div v-for="(bonk_decal, key) in live_game_data.customBonks[current_bonk].impactDecals" class="row impactDecalRow" :key="'bd_'+bonk_decal.location">
          <div class="imageRowInner">
            <label class="checkbox">
              <input type="checkbox" class="imageEnabled" :checked="itemIsEnabled(key)" @change="handleIncludeCheckbox($event,key)">
              <div class="checkHover"></div>
              <img src="ui/checkmark.png" class="checkmark">
            </label>
            <img class="imageImage" :src="'file://'+getDecalsPath(bonk_decal.location)"></img>
            <p class="imageLabel" :title="bonk_decal.location">{{ bonk_decal.location }}</p>
            <div class="decalSettings">
              <img src="ui/duration.png" title="Duration (s)">
              <input type="number" class="decalDuration" min="0" v-model="live_game_data.customBonks[current_bonk].impactDecals[key].duration">
              <img src="ui/scale.png" title="Scale">
              <input type="number" class="decalScale" min="0" v-model="live_game_data.customBonks[current_bonk].impactDecals[key].scale">
            </div>
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
  name: 'BonkDecals',
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
        window.ipc.send("UPLOAD_DECAL", {game_id: this.app_game.id, file_name: file.name, current_bonk: this.current_bonk, file_path: file.path});
      }
    },
    removeItem(item_index) {
      if(confirm("are you sure you want to remove this Decal?")) {
        this.live_game_data.customBonks[this.current_bonk].impactDecals.splice(item_index,1);
      }
    },
    getDecalsPath(filename) {
      var dsep = this.live_app_data.sys_sep;
      var path = this.live_game_data.game_data_path + "/decals/" + filename;
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
      for (var i = 0; i < this.live_game_data.customBonks[this.current_bonk].impactDecals.length; i++)
        if (isChecked == true) {
          this.enableItem(i);
        } else {
          this.disableItem(i);
        }
    },
    itemIsEnabled(item_index) {
      if (this.live_game_data.customBonks[this.current_bonk].impactDecals[item_index].enabled === true)
      {
        return true;
      }
      return false;
    },
    allItemsEnabled() {
      var allIncluded = true;
      for (var i = 0; i < this.live_game_data.customBonks[this.current_bonk].impactDecals.length; i++) {
        if(this.itemIsEnabled(i) == false) {
          allIncluded = false;
        }
      }
      return allIncluded;
    },
    enableItem(item_index) {
      if(!this.itemIsEnabled(item_index)) {
        this.live_game_data.customBonks[this.current_bonk].impactDecals[item_index].enabled = true;
      }
    },
    disableItem(item_index) {
      if(this.itemIsEnabled(item_index)) {
        this.live_game_data.customBonks[this.current_bonk].impactDecals[item_index].enabled = false;
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