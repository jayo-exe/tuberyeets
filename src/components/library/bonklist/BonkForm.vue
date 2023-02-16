<template>
  <div id="bonkDetails">
    <h2>Edit Bonk</h2>
    <span class="btn btn-red back-btn" @click="setSection('BonkList')">Back</span>

    <div class="body-panel">
      <h3>Custom Bonk Name</h3>
      <hr>
      <input type="text" min="0" step="1" class="bonkName grid1-3" v-model="live_game_data.customBonks[current_bonk].name" @input="(e) => {setBonkField('name', e.target.value)}">
    </div>

    <div class="body-panel">
      <h3>Setting Overrides</h3>
      <hr>
      <div class="bonkDetailsTable">
        <p class="grid2">Item Count <i class="fa fa-info-circle"
                                       v-b-tooltip.hover.left="'The number of items to throw.  This is ignored for events with a quantity'"
        ></i></p>
        <input type="number" min="0" step="1" class="barrageCount"
               v-model="live_game_data.customBonks[current_bonk].barrageCount"
               @input="(e) => {setBonkField('barrageCount', e.target.value)}">

        <label class="checkbox grid1">
          <input type="checkbox" class="throwAway"
                 v-model="live_game_data.customBonks[current_bonk].throwAway"
                 @change="(e) => {setBonkField('throwAway', e.target.checked)}">
          <div class="checkHover"></div>
          <img src="ui/checkmark.png" class="checkmark">
        </label>
        <p class="grid2-3" >Throw Away <i class="fa fa-info-circle"
                                          v-b-tooltip.hover.left="'Throw items away instead of towards model'"
        ></i></p>

        <label class="checkbox grid1">
          <input type="checkbox" class="barrageFrequencyOverride"
                 v-model="live_game_data.customBonks[current_bonk].barrageFrequencyOverride"
                 @change="(e) => {setBonkField('barrageFrequencyOverride', e.target.checked)}">
          <div class="checkHover"></div>
          <img src="ui/checkmark.png" class="checkmark">
        </label>
        <p class="grid2">Barrage Frequency (s) <i class="fa fa-info-circle"
                                                  v-b-tooltip.hover.left="'Average number of seconds between thrown items in a barrage'"
        ></i></p>
        <input type="number" min="0" step="1" class="barrageFrequency grid3"
               v-model="live_game_data.customBonks[current_bonk].barrageFrequency"
               @input="(e) => {setBonkField('barrageFrequency', e.target.value)}"
               :disabled="!live_game_data.customBonks[current_bonk].barrageFrequencyOverride"
        >

        <label class="checkbox grid1">
          <input type="checkbox" class="throwDurationOverride"
                 v-model="live_game_data.customBonks[current_bonk].throwDurationOverride"
                 @change="(e) => {setBonkField('throwDurationOverride', e.target.checked)}">
          <div class="checkHover"></div>
          <img src="ui/checkmark.png" class="checkmark">
        </label>
        <p class="grid2">Throw Duration <i class="fa fa-info-circle"
                                           v-b-tooltip.hover.left="'The number of seconds that a thrown item exists on the screen'"
        ></i></p>
        <input type="number" min="0" step="1" class="throwDuration grid3"
               v-model="live_game_data.customBonks[current_bonk].throwDuration"
               @input="(e) => {setBonkField('throwDuration', e.target.value)}"
               :disabled="!live_game_data.customBonks[current_bonk].throwDurationOverride"
        >

        <label class="checkbox grid1">
          <input type="checkbox" class="spinSpeedOverride"
                 v-model="live_game_data.customBonks[current_bonk].spinSpeedOverride"
                 @change="(e) => {setBonkField('spinSpeedOverride', e.target.checked)}"
          >
          <div class="checkHover"></div>
          <img src="ui/checkmark.png" class="checkmark">
        </label>
        <p class="grid2">Spin Speed (Min) <i class="fa fa-info-circle"
                                             v-b-tooltip.hover.left="'Minimum Spin Speed of thrown items'"
        ></i></p>
        <input type="number" min="0" step="1" class="spinSpeedMin grid3"
               v-model="live_game_data.customBonks[current_bonk].spinSpeedMin"
               @input="(e) => {setBonkField('spinSpeedMin', e.target.value)}"
               :disabled="!live_game_data.customBonks[current_bonk].spinSpeedOverride"
        >

        <p class="grid2">Spin Speed (Max) <i class="fa fa-info-circle"
                                             v-b-tooltip.hover.left="'Maximum Spin Speed of thrown items'"
        ></i></p>
        <input type="number" min="0" step="1" class="spinSpeedMax grid3"
               v-model="live_game_data.customBonks[current_bonk].spinSpeedMax"
               @input="(e) => {setBonkField('spinSpeedMax', e.target.value)}"
               :disabled="!live_game_data.customBonks[current_bonk].spinSpeedOverride"
        >

        <label class="checkbox grid1">
          <input type="checkbox" class="throwAngleOverride"
                 v-model="live_game_data.customBonks[current_bonk].throwAngleOverride"
                 @change="(e) => {setBonkField('throwAngleOverride', e.target.checked)}">
          <div class="checkHover"></div>
          <img src="ui/checkmark.png" class="checkmark">
        </label>
        <p class="grid2">Throw Angle (Min) <i class="fa fa-info-circle"
                                              v-b-tooltip.hover.left="'Minimum Throw Angle for thrown items'"
        ></i></p>
        <input type="number" min="-90" step="1" class="throwAngleMin grid3"
               v-model="live_game_data.customBonks[current_bonk].throwAngleMin"
               @input="(e) => {setBonkField('throwAngleMin', e.target.value)}"
               :disabled="!live_game_data.customBonks[current_bonk].throwAngleOverride"
        >

        <p class="grid2">Throw Angle (Max) <i class="fa fa-info-circle"
                                              v-b-tooltip.hover.left="'Maximum Throw Angle for thrown items'"
        ></i></p>
        <input type="number" min="90" step="1" class="throwAngleMax grid3"
               v-model="live_game_data.customBonks[current_bonk].throwAngleMax"
               @input="(e) => {setBonkField('throwAngleMax', e.target.value)}"
               :disabled="!live_game_data.customBonks[current_bonk].throwAngleOverride"
        >

        <p class="grid2">Windup Time (s) <i class="fa fa-info-circle"
                                            v-b-tooltip.hover.left="'Number of seconds of delay between a barrage being triggered and the first item being thrown'"
        ></i></p>
        <input type="number" min="0" class="windupDelay grid3"
               v-model="live_game_data.customBonks[current_bonk].windupDelay"
               @input="(e) => {setBonkField('windupDelay', e.target.value)}"
        >
      </div>
    </div>

    <div class="body-panel">
      <h3>Gallery Overrides</h3>
      <hr>
      <div class="bonkDetailsTable">
        <label class="checkbox grid1">
          <input type="checkbox" class="itemsOverride"
                 v-model="live_game_data.customBonks[current_bonk].itemsOverride"
                 @change="(e) => {setBonkField('itemsOverride', e.target.checked)}">
          <div class="checkHover"></div>
          <img src="ui/checkmark.png" class="checkmark">
        </label>
        <p class="grid2">Bonk Items <i class="fa fa-info-circle"
                                       v-b-tooltip.hover.left="'Select some thrown items that will be used in this Bonk'"
        ></i></p>
        <button class="images grid3 btn btn-blue"
                @click="setSection('BonkImages')"
                :disabled="!live_game_data.customBonks[current_bonk].itemsOverride"
        >Gallery</button>

        <label class="checkbox grid1">
          <input type="checkbox" class="soundsOverride"
                 v-model="live_game_data.customBonks[current_bonk].soundsOverride"
                 @change="(e) => {setBonkField('soundsOverride', e.target.checked)}">
          <div class="checkHover"></div>
          <img src="ui/checkmark.png" class="checkmark">
        </label>
        <p class="grid2">Impact Sounds <i class="fa fa-info-circle"
                                          v-b-tooltip.hover.left="'Select some impact sounds that will be used in this Bonk'"
        ></i></p>
        <button class="sounds grid3 btn btn-blue"
                @click="setSection('BonkSounds')"
                :disabled="!live_game_data.customBonks[current_bonk].soundsOverride"
        >Gallery</button>

        <p class="grid2">Impact Decals <i class="fa fa-info-circle"
                                          v-b-tooltip.hover.left="'Select some Impact Decals that will be used in this Bonk'"
        ></i></p>
        <button class="impactDecals grid3 btn btn-blue" @click="setSection('BonkDecals')">Gallery</button>

        <p class="grid2">Windup Sounds <i class="fa fa-info-circle"
                                          v-b-tooltip.hover.left="'Select some Windup Sounds that will be used in this Bonk'"
        ></i></p>
        <button class="windupSounds grid3 btn btn-blue" @click="setSection('BonkWindups')">Gallery</button>
      </div>
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
    setBonkField(field, value) {
      this.$emit("set-game-field",{
        field: `customBonks.${current_bonk}.${field}`,
        value: value
      });
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
    }
  },
}
</script>