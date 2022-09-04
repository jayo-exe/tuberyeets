<template>
  <div id="bonkDetails">
    <span class="windowCorner"></span>
    <span class="windowBack" @click="setSection('BonkList')">BACK</span>
    <div id="bonkDetailsTable">
      <div class="header">
        <div class="headerInner">
          Custom Bonk Name
        </div>
      </div>
      <input type="text" min="0" step="1" class="bonkName grid1-3" v-model="live_game_data.customBonks[current_bonk].name">

      <div class="header">
        <div class="headerInner">
          Setting Overrides
        </div>
      </div>

      <p class="grid2">Item Count <i class="fa fa-info-circle"
                                     v-b-tooltip.hover.left="'The number of items to throw.  This is ignored for events with a quantity'"
      ></i></p>
      <input type="number" min="0" step="1" class="barrageCount" v-model="live_game_data.customBonks[current_bonk].barrageCount">

      <label class="checkbox grid1">
        <input type="checkbox" class="throwAway" v-model="live_game_data.customBonks[current_bonk].throwAway">
        <div class="checkHover"></div>
        <img src="ui/checkmark.png" class="checkmark">
      </label>
      <p class="grid2-3" >Throw Away <i class="fa fa-info-circle"
                                        v-b-tooltip.hover.left="'Throw items away instead of towards model'"
      ></i></p>

      <label class="checkbox grid1">
        <input type="checkbox" class="barrageFrequencyOverride" v-model="live_game_data.customBonks[current_bonk].barrageFrequencyOverride">
        <div class="checkHover"></div>
        <img src="ui/checkmark.png" class="checkmark">
      </label>
      <p class="grid2">Barrage Frequency (s) <i class="fa fa-info-circle"
                                                v-b-tooltip.hover.left="'Average number of seconds between thrown items in a barrage'"
      ></i></p>
      <input type="number" min="0" step="1" class="barrageFrequency grid3"
             v-model="live_game_data.customBonks[current_bonk].barrageFrequency"
             :disabled="!live_game_data.customBonks[current_bonk].barrageFrequencyOverride"
      >

      <label class="checkbox grid1">
        <input type="checkbox" class="throwDurationOverride" v-model="live_game_data.customBonks[current_bonk].throwDurationOverride">
        <div class="checkHover"></div>
        <img src="ui/checkmark.png" class="checkmark">
      </label>
      <p class="grid2">Throw Duration <i class="fa fa-info-circle"
                                         v-b-tooltip.hover.left="'The number of seconds that a thrown item exists on the screen'"
      ></i></p>
      <input type="number" min="0" step="1" class="throwDuration grid3"
             v-model="live_game_data.customBonks[current_bonk].throwDuration"
             :disabled="!live_game_data.customBonks[current_bonk].throwDurationOverride"
      >

      <label class="checkbox grid1">
        <input type="checkbox" class="spinSpeedOverride" v-model="live_game_data.customBonks[current_bonk].spinSpeedOverride">
        <div class="checkHover"></div>
        <img src="ui/checkmark.png" class="checkmark">
      </label>
      <p class="grid2">Spin Speed (Min) <i class="fa fa-info-circle"
                                           v-b-tooltip.hover.left="'Minimum Spin Speed of thrown items'"
      ></i></p>
      <input type="number" min="0" step="1" class="spinSpeedMin grid3"
             v-model="live_game_data.customBonks[current_bonk].spinSpeedMin"
             :disabled="!live_game_data.customBonks[current_bonk].spinSpeedOverride"
      >

      <p class="grid2">Spin Speed (Max) <i class="fa fa-info-circle"
                                           v-b-tooltip.hover.left="'Maximum Spin Speed of thrown items'"
      ></i></p>
      <input type="number" min="0" step="1" class="spinSpeedMax grid3"
             v-model="live_game_data.customBonks[current_bonk].spinSpeedMax"
             :disabled="!live_game_data.customBonks[current_bonk].spinSpeedOverride"
      >

      <label class="checkbox grid1">
        <input type="checkbox" class="throwAngleOverride" v-model="live_game_data.customBonks[current_bonk].throwAngleOverride">
        <div class="checkHover"></div>
        <img src="ui/checkmark.png" class="checkmark">
      </label>
      <p class="grid2">Throw Angle (Min) <i class="fa fa-info-circle"
                                            v-b-tooltip.hover.left="'Minimum Throw Angle for thrown items'"
      ></i></p>
      <input type="number" min="-90" step="1" class="throwAngleMin grid3"
             v-model="live_game_data.customBonks[current_bonk].throwAngleMin"
             :disabled="!live_game_data.customBonks[current_bonk].throwAngleOverride"
      >

      <p class="grid2">Throw Angle (Max) <i class="fa fa-info-circle"
                                            v-b-tooltip.hover.left="'Maximum Throw Angle for thrown items'"
      ></i></p>
      <input type="number" min="90" step="1" class="throwAngleMax grid3"
             v-model="live_game_data.customBonks[current_bonk].throwAngleMax"
             :disabled="!live_game_data.customBonks[current_bonk].throwAngleOverride"
      >

      <p class="grid2">Windup Time (s) <i class="fa fa-info-circle"
                                          v-b-tooltip.hover.left="'Number of seconds of delay between a barrage being triggered and the first item being thrown'"
      ></i></p>
      <input type="number" min="0" class="windupDelay grid3"
             v-model="live_game_data.customBonks[current_bonk].windupDelay"
      >

      <br/>

      <div class="header">
        <div class="headerInner">
          Gallery Overrides
        </div>
      </div>

      <label class="checkbox grid1">
        <input type="checkbox" class="itemsOverride" v-model="live_game_data.customBonks[current_bonk].itemsOverride">
        <div class="checkHover"></div>
        <img src="ui/checkmark.png" class="checkmark">
      </label>
      <p class="grid2">Bonk Items <i class="fa fa-info-circle"
                                     v-b-tooltip.hover.left="'Select some thrown items that will be used in this Bonk'"
      ></i></p>
      <button class="images grid3"
              @click="setSection('BonkImages')"
              :disabled="!live_game_data.customBonks[current_bonk].itemsOverride"
      >Gallery</button>

      <label class="checkbox grid1">
        <input type="checkbox" class="soundsOverride" v-model="live_game_data.customBonks[current_bonk].soundsOverride">
        <div class="checkHover"></div>
        <img src="ui/checkmark.png" class="checkmark">
      </label>
      <p class="grid2">Impact Sounds <i class="fa fa-info-circle"
                                        v-b-tooltip.hover.left="'Select some impact sounds that will be used in this Bonk'"
      ></i></p>
      <button class="sounds grid3"
              @click="setSection('BonkSounds')"
              :disabled="!live_game_data.customBonks[current_bonk].soundsOverride"
      >Gallery</button>

      <p class="grid2">Impact Decals <i class="fa fa-info-circle"
                                        v-b-tooltip.hover.left="'Select some Impact Decals that will be used in this Bonk'"
      ></i></p>
      <button class="impactDecals grid3" @click="setSection('BonkDecals')">Gallery</button>

      <p class="grid2">Windup Sounds <i class="fa fa-info-circle"
                                        v-b-tooltip.hover.left="'Select some Windup Sounds that will be used in this Bonk'"
      ></i></p>
      <button class="windupSounds grid3" @click="setSection('BonkWindups')">Gallery</button>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
//import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'BonkForm',
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