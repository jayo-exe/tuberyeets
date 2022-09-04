<template>
  <div id="imageDetails">
    <span class="windowCorner"></span>
    <span class="windowBack" @click="setSection('ItemList')">BACK</span>
    <div id="imageDetailsInner">
      <img class="imageImage" :src="'file://'+getThrowsPath(live_game_data.throws[current_item].location)">
      <p class="imageLabel">{{ live_game_data.throws[current_item].location }}</p>
      <div id="testImage">
        <div class="testContainer">
          <div id="testSingle" class="topButton" @click="testCustomItem(current_item)">
            <div class="overlayButton"></div>
            <div class="innerTopButton">TEST</div>
            <div class="cornerTopButton"></div>
          </div>
        </div>
      </div>
      <div id="imageSettings">
        <div id="imageSettings1">
          <div class="imageDetailsShadow">
            <div class="imageDetailsInner">
              <div class="settingsTable">
                <p>Scale <i class="fa fa-info-circle"
                            v-b-tooltip.hover.left="'The relative size of the object compared to the input image'"
                ></i></p>
                <input type="number" class="imageScale" min="0" step="0.1" v-model="live_game_data.throws[current_item].scale">
                <p>Weight <i class="fa fa-info-circle"
                             v-b-tooltip.hover.left="'This determines how much force is applied to the vTube model on impact'"
                ></i></p>
                <input type="range" class="imageWeight" min="0" max="1" step="0.1" v-model="live_game_data.throws[current_item].weight">
                <p>Volume <i class="fa fa-info-circle"
                             v-b-tooltip.hover.left="'The volume of the impact sound'"
                ></i></p>
                <input class="imageSoundVolume" type="range" min="0" max="1" step="0.1" v-model="live_game_data.throws[current_item].volume">
              </div>
            </div>
          </div>
        </div>
        <div id="imageSettings2">
          <div class="imageDetailsShadow">
            <div class="imageDetailsInner">
              <div class="settingsTable">
                <p>Sound</p>
                <select class="imageSoundName" v-model="live_game_data.throws[current_item].sound">
                  <option value="">(Use default sounds)</option>
                  <option v-for="(bonk_impact, key) in live_game_data.impacts" :value="bonk_impact.location">{{ bonk_impact.location }}</option>
                </select>
              </div>
            </div>
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
  name: 'ItemForm',
  props: ['app_data','app_game','game_data','current_item'],
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
    getThrowsPath(filename) {
      var dsep = this.live_app_data.sys_sep;
      var path = this.live_game_data.game_data_path + "/throws/" + filename;
      return path.replaceAll("/",dsep);
    },
    removeSoundFile() {
      this.live_game_data.throws[this.current_item].sound = sound_file;
    },
    updateGameData() {
      this.$emit("update-game-data",this.live_game_data);
    },
    testCustomItem(item_index) {
      console.log('Testing custom item: ' + item_index);
      let item = this.live_game_data.throws[item_index];
      window.ipc.send('TEST_CUSTOM_ITEM', item);
    },
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