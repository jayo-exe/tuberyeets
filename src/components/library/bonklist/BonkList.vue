<template>
  <div>
    <h2>Bonks</h2>
    <div id="customBonks" class="body-panel">
      <h3>Custom Bonks</h3>
      <button class="btn btn-green add-btn" @click="addBonk">Add Bonk</button>
      <hr>
      <div id="bonksTable" class="imageTable">
        <table class="listTable">
          <thead>
          <tr>
            <th>Bonk Name</th>
            <th style="width: 164px;">Actions</th>
          </tr>
          </thead>
          <tbody>
            <tr v-for="(custom_bonk, key) in live_game_data.customBonks"  :key="'bcb_'+key">
              <td>
                <p class="imageLabel">{{ custom_bonk.name }}</p>
              </td>
              <td>
                <button class="btn btn-green" @click="editBonk(key)">Edit</button>
                <button class="btn btn-blue" @click="testCustomBonk(key)">Test</button>
                <button class="btn btn-red" @click="removeBonk(key)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
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
    testCustomBonk(item_index) {
      console.log('Testing custom bonk: ' + item_index);
      window.ipc.send('TEST_CUSTOM_BONK', item_index);
    },
    updateGameData() {
      this.$emit("update-game-data",this.live_game_data);
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