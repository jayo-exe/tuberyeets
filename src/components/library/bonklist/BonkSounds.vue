<template>
  <div id="bonkSoundsCustom">
    <span class="windowCorner"></span>
    <span class="windowBack" @click="setSection('BonkForm')">BACK</span>
    <div id="soundTableCustom" class="imageTable">
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
      <input id="loadSoundCustom" ref="file" type="file" accept="audio/*" multiple hidden @change="handleNewFiles">
      <div id="newSoundCustom" class="new row" @click="$refs.file.click()">
        <div class="imageRowShadow">
          <div class="imageRowInner">
            <img class="imageImage" src="ui/add.png"></img>
            <p class="imageLabel">ADD SOUNDS</p>
            <div class="imageRowHover"></div>
          </div>
        </div>
      </div>
      <div v-for="(bonk_impact, key) in live_game_data.impacts" id="soundRowCustom" class="row" :key="'bs_'+key">
        <div class="imageRowShadow">
          <div class="imageRowInner">
            <label class="checkbox">
              <input type="checkbox" class="imageEnabled" :checked="itemIsIncluded(key)" @change="handleIncludeCheckbox($event,key)">
              <div class="checkHover"></div>
              <img src="ui/checkmark.png" class="checkmark">
            </label>
            <label class="cogwheel"></label>
            <p class="imageLabel":title="bonk_impact.location">{{ bonk_impact.location }}</p>
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
  name: 'BonkSounds',
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
        console.log('sending upload message for impact' + file.name);
        window.ipc.send("UPLOAD_IMPACT", {game_id: this.app_game.id, file_name: file.name, file_path: file.path});
      }
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
      for (var i = 0; i < this.live_game_data.impacts.length; i++)
        if (isChecked == true) {
          this.enableItem(i);
        } else {
          this.disableItem(i);
        }
    },
    itemIsIncluded(item_index) {
      if (this.live_game_data.impacts[item_index].customs.includes(this.current_bonk))
      {
        return true;
      }
      return false;
    },
    allItemsIncluded() {
      var allIncluded = true;
      for (var i = 0; i < this.live_game_data.impacts.length; i++) {
        if(this.itemIsIncluded(i) == false) {
          allIncluded = false;
        }
      }

      return allIncluded;
    },
    enableItem(item_index) {
      if(!this.itemIsIncluded(item_index)) {
        this.live_game_data.impacts[item_index].customs.push(this.current_bonk);
      }
    },
    disableItem(item_index) {
      if(this.itemIsIncluded(item_index)) {
        this.live_game_data.impacts[item_index].customs.splice(this.live_game_data.impacts[item_index].customs.indexOf(this.current_bonk),1);
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