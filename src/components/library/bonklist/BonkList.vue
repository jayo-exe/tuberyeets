<template>
  <div id="customBonks">
    <span id="imagesDefaultTab" class="tab firstTab selectedTab">Custom Bonks</span>
    <span id="imagesDefaultTab" class="tab folderTab"><a @click="openGameFolder" v-b-tooltip.hover.left="'Delete files and import/export effect packs'">Open Game Folder</a></span>
    <div id="bonksTable" class="imageTable">
      <div id="bonksAdd" class="new row" @click="addBonk">
        <div class="imageRowShadow">
          <div class="imageRowInner">
            <img class="imageImage" src="ui/add.png"></img>
            <p class="imageLabel">ADD BONK</p>
            <div class="imageRowHover"></div>
          </div>
        </div>
      </div>
      <div v-for="(custom_bonk, key) in live_game_data.customBonks"  id="customBonkRow" class="row customBonkRow" :key="'bcb_'+key">
        <div class="imageRowShadow">
          <div class="imageRowInner">
            <label class="cogwheel">
              <button class="testBonk tooltip-hover"
                      @click="testCustomBonk(key)"

              >Details</button>
              <img :id="'testicon'+key" src="ui/cog.png" class="checkmark" v-b-tooltip.hover.right="'Test'">
            </label>
            <img class="imageImage bonkDetailsButton" src="ui/cog64.png" @click="editBonk(key)" v-b-tooltip.hover.top="'Edit'"></img>
            <p class="imageLabel">{{ custom_bonk.name }}</p>
            <label class="delete">
              <button class="imageRemove" @click="removeBonk(key)" ></button>
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
import isotip from 'isotip';
export default {
  name: 'BonkList',
  props: ['app_data','app_game','game_data','current_bonk'],
  data : function() {
    return {
      live_app_data: this.app_data,
      live_game_data: this.game_data,
    }
  },
  methods: {
    addBonk()
    {
      var newBonkNumber = 1;
      var customBonks = this.live_game_data.customBonks;
      if (customBonks == null)
        customBonks = {};

      while (customBonks["Custom_Bonk_" + newBonkNumber] != null)
        newBonkNumber++;

      this.$set(this.live_game_data.customBonks, "Custom_Bonk_" + newBonkNumber, {
        "name": "Custom Bonk " + newBonkNumber,
        "barrageCount": 1,
        "barrageFrequencyOverride": false,
        "barrageFrequency": this.live_app_data.barrageFrequency,
        "throwDurationOverride": false,
        "throwDuration": this.live_app_data.throwDuration,
        "throwAngleOverride": false,
        "throwAngleMin": this.live_app_data.throwAngleMin,
        "throwAngleMax": this.live_app_data.throwAngleMax,
        "spinSpeedOverride": false,
        "spinSpeedMin": this.live_app_data.spinSpeedMin,
        "spinSpeedMax": this.live_app_data.spinSpeedMax,
        "itemsOverride": false,
        "soundsOverride": false,
        "impactDecals": [],
        "windupSounds": [],
        "windupDelay": 0,
        "throwAway": false
      });

      for (var i = 0; i < this.live_game_data.throws.length; i++)
        if (this.live_game_data.throws[i].enabled)
          this.live_game_data.throws[i].customs.push("Custom Bonk " + newBonkNumber);

      for (var i = 0; i < this.live_game_data.impacts.length; i++)
        if (this.live_game_data.impacts[i].enabled)
          this.live_game_data.impacts[i].customs.push("Custom Bonk " + newBonkNumber);

    },
    editBonk(item_index) {
      this.$emit("edit-custom-bonk",item_index);
    },
    removeBonk(item_index) {
      if(confirm("are you sure you want to remove this Custom Bonk?")) {
        var item_sound = this.live_game_data.customBonks[item_index].location;
        this.$delete(this.live_game_data.customBonks,item_index);

        for (var i = 0; i < this.live_game_data.throws.length; i++)
          if (this.live_game_data.throws[i].customs.includes(item_index))
            this.live_game_data.throws[i].customs.splice(this.live_game_data.throws[i].customs.indexOf(item_index),1);

        for (var i = 0; i < this.live_game_data.impacts.length; i++)
          if (this.live_game_data.impacts[i].customs.includes(item_index))
            this.live_game_data.impacts[i].customs.splice(this.live_game_data.impacts[i].customs.indexOf(item_index),1);
      }
    },
    testSingle() {
      console.log('Testing single random bonk');
      window.ipc.send('TEST_SINGLE', true);
    },
    testBarrage() {
      console.log('Testing single barrage');
      window.ipc.send('TEST_BARRAGE', true);
    },
    testCustomBonk(item_index) {
      console.log('Testing custom bonk: ' + item_index);
      window.ipc.send('TEST_CUSTOM_BONK', item_index);
    },
    updateGameData() {
      this.$emit("update-game-data",this.live_game_data);
    },
    openGameFolder() {
      window.ipc.send("OPEN_GAME_FOLDER");
    }
  },
  mounted() {
    isotip.init();
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