<template>
  <div id="bonkSounds">
    <span id="soundsDefaultTab" class="tab firstTab selectedTab">Bonk Sounds</span>
    <span id="imagesDefaultTab" class="tab folderTab"><a @click="openGameFolder" v-b-tooltip.hover.left="'Delete files and import/export effect packs'">Open Game Folder</a></span>
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
      <input id="loadSound" type="file" ref="file" accept="audio/*" multiple hidden @change="uploadSoundFile">
      <div id="newSound" class="new row" @click="$refs.file.click()">
        <div class="imageRowShadow">
          <div class="imageRowInner">
            <img class="imageImage" src="ui/add.png"></img>
            <p class="imageLabel">ADD SOUNDS</p>
            <div class="imageRowHover"></div>
          </div>
        </div>
      </div>
      <div v-for="(bonk_impact, key) in live_game_data.impacts" class="row soundRow" :key="'bim_'+bonk_impact.location">
        <div class="imageRowShadow">
          <div class="imageRowInner">
            <label class="checkbox">
              <input type="checkbox" class="imageEnabled" :checked="itemIsEnabled(key)" @change="handleIncludeCheckbox($event,key)">
              <div class="checkHover"></div>
              <img src="ui/checkmark.png" class="checkmark">
            </label>
            <label class="cogwheel">
              <img src="ui/speaker.png" class="checkmark" title="Volume" v-b-tooltip.hover.right="'Volume'"></img>
            </label>
            <p class="imageLabel" :title="bonk_impact.location">{{ bonk_impact.location }}</p>
            <input class="soundVolume" type="range" min="0" max="1" step="0.1" v-model="live_game_data.impacts[key].volume">
            <label class="delete">
              <button class="imageRemove" @click="removeSoundFile(key)"></button>
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
  name: 'SoundList',
  props: ['app_data','app_game','game_data','current_item'],
  data : function() {
    return {
      live_app_data: this.app_data,
      live_game_data: this.game_data,
    }
  },
  methods: {
    getImpactsPath(filename) {
      var dsep = this.live_app_data.sys_sep;
      var path = this.live_game_data.game_data_path + "/impacts/" + filename;
      return path.replaceAll("/",dsep);
    },
    uploadSoundFile(event) {
      var file_list = event.target.files;
      for (let i = 0; i < file_list.length; i++) {
        let file = file_list.item(i);
        console.log('sending upload message for impact' + file.name);
        window.ipc.send("UPLOAD_IMPACT", {game_id: this.app_game.id, file_name: file.name, file_path: file.path});
      }
    },
    removeSoundFile(item_index) {
      if(confirm("are you sure you want to remove this Impact sound?")) {
        var item_sound = this.live_game_data.impacts[item_index].location;
        this.live_game_data.impacts.splice(item_index,1);
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
      for (var i = 0; i < this.live_game_data.impacts.length; i++)
        if (isChecked == true) {
          this.enableItem(i);
        } else {
          this.disableItem(i);
        }
    },
    itemIsEnabled(item_index) {
      if (this.live_game_data.impacts[item_index].enabled === true)
      {
        return true;
      }
      return false;
    },
    allItemsEnabled() {
      var allIncluded = true;
      for (var i = 0; i < this.live_game_data.impacts.length; i++) {
        if(this.itemIsEnabled(i) == false) {
          allIncluded = false;
        }
      }
      return allIncluded;
    },
    enableItem(item_index) {
      if(!this.itemIsEnabled(item_index)) {
        this.live_game_data.impacts[item_index].enabled = true;
      }
    },
    disableItem(item_index) {
      if(this.itemIsEnabled(item_index)) {
        this.live_game_data.impacts[item_index].enabled = false;
      }
    },
    openGameFolder() {
      window.ipc.send("OPEN_GAME_FOLDER");
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