<template>
  <div v-if="soundsList">
    <h2>Sounds</h2>

    <div id="bonkSounds" class="body-panel">
      <h3>Sound Library</h3>
      <input id="loadSound" type="file" ref="file" accept="audio/*" multiple hidden @change="uploadSoundFile">
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
              <th>Default</th>
              <th>Name</th>
              <th>Volume</th>
              <th>Delete?</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(bonk_impact, key) in soundsList" :key="'bim_'+bonk_impact.location+listKey">
              <td>
                <label class="checkbox">
                  <input type="checkbox" class="imageEnabled" :checked="itemIsEnabled(key)" @change="handleIncludeCheckbox($event,key)">
                  <div class="checkHover"></div>
                  <img src="ui/checkmark.png" class="checkmark">
                </label>
              </td>
              <td>
                <p class="imageLabel" :title="bonk_impact.location">{{ bonk_impact.location }}</p>
              </td>
              <td>
                <label class="cogwheel">
                  <img src="ui/speaker.png" class="checkmark" title="Volume" v-b-tooltip.hover.right="'Volume'"></img>
                </label>
                <input class="soundVolume" type="range" min="0" max="1" step="0.1" v-model="soundsList[key].volume" @input="() => {updateSound(key, 'volume')}">
              </td>
              <td>
                <label class="delete">
                  <button class="imageRemove" @click="removeSoundFile(key)"></button>
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

<script>

export default {
  name: 'SoundList',
  props: ['app_data','app_game','game_data','current_item'],
  data : function() {
    return {
      live_app_data: this.app_data,
      live_game_data: this.game_data,
      soundsList: [],
      listKey: 0
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
    removeSoundFile(itemId) {
      if(confirm("are you sure you want to remove this Impact sound?")) {
        this.$delete(this.soundsList, itemId);
        this.$gameData.delete(`impacts.${itemId}`).then((success) => {
          this.listKey++;
        });
      }
    },
    updateSound(impactId, field) {
      this.$gameData.update(`impacts.${impactId}.${field}`, this.soundsList[impactId][field]).then((success) => {
        if(!success) console.log('updateSound failed');
        this.listKey++;
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
      for (var i = 0; i < this.soundsList.length; i++)
        if (isChecked == true) {
          this.enableItem(i);
        } else {
          this.disableItem(i);
        }
    },
    itemIsEnabled(itemId) {
      if (this.soundsList[itemId].enabled === true)
      {
        return true;
      }
      return false;
    },
    allItemsEnabled() {
      var allIncluded = true;
      for (var i = 0; i < this.soundsList.length; i++) {
        if(this.itemIsEnabled(i) == false) {
          allIncluded = false;
        }
      }
      return allIncluded;
    },
    enableItem(itemId) {
      if(!this.itemIsEnabled(itemId)) {
        this.soundsList[itemId].enabled = true;
        this.updateSound(itemId, 'enabled');
      }
    },
    disableItem(itemId) {
      if(this.itemIsEnabled(itemId)) {
        this.soundsList[itemId].enabled = false;
        this.updateSound(itemId, 'enabled');
      }
    }
  },
  components: {
    //HelloWorld
  },
  mounted() {
    //this.soundsList = this.$gameData.readSync(`impacts`);

    this.$gameData.read(`impacts`).then((result) => {
      this.soundsList = result;
    });

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
  },
}
</script>