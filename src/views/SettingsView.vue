<template>
  <div>
    <h2>App Settings</h2>
    <div id="mainBody" class="settings">
      <div class="body-panel">
        <h3>Model Settings</h3>
        <hr>
        <div class="settingsBlock">
          <p class="grid1">Global Volume</p>
          <input type="range" id="volume" class="grid2" min="0" max="1" v-model="live_app_data.volume" @input="(e) => {setField('volume', e.target.value)}" step="0.1">

          <p class="grid1">Item Scale (At Min Model Size)</p>
          <input type="number" id="itemScaleMin" class="grid2" min="0" v-model="live_app_data.itemScaleMin" @input="(e) => {setField('itemScaleMin', e.target.value)}">

          <p class="grid1">Item Scale (At Max Model Size)</p>
          <input type="number" id="itemScaleMax" class="grid2" min="0" v-model="live_app_data.itemScaleMax" @input="(e) => {setField('itemScaleMax', e.target.value)}">

          <p class="grid1">Impact Delay (ms)</p>
          <input type="number" id="delay" class="grid2" min="0" v-model="live_app_data.delay" @input="(e) => {setField('delay', e.target.value)}">

          <p class="grid1">Model Return Speed</p>
          <input type="number" id="returnSpeed" class="grid2" min="0" v-model="live_app_data.returnSpeed" @input="(e) => {setField('returnSpeed', e.target.value)}">

          <p class="grid1">Close Eyes on Hit</p>
          <label class="checkbox grid2">
            <input type="checkbox" id="closeEyes" v-model="live_app_data.closeEyes" @change="(e) => {setField('closeEyes', e.target.checked)}">
            <div class="checkHover"></div>
            <img src="ui/checkmark.png" class="checkmark">
          </label>

          <p class="grid1">Open Eyes on Hit</p>
          <label class="checkbox grid2">
            <input type="checkbox" id="openEyes" v-model="live_app_data.openEyes" @change="(e) => {setField('openEyes', e.target.checked)}">
            <div class="checkHover"></div>
            <img src="ui/checkmark.png" class="checkmark">
          </label>

        </div>
      </div>

      <div class="body-panel">
        <h3>Throw/Bonk Defaults</h3>
        <hr>
        <div class="settingsBlock">
          <p class="grid1">Barrage Count</p>
          <input type="number" id="barrageCount" class="grid2" min="0" v-model="live_app_data.barrageCount" @input="(e) => {setField('barrageCount', e.target.value)}" >

          <p class="grid1">Barrage Frequency (s)</p>
          <input type="number" id="barrageFrequency" class="grid2" min="0" v-model="live_app_data.barrageFrequency" @input="(e) => {setField('barrageFrequency', e.target.value)}" >

          <p class="grid1">Throw Duration</p>
          <input type="number" id="throwDuration" class="grid2" min="0.1" v-model="live_app_data.throwDuration" @input="(e) => {setField('throwDuration', e.target.value)}" >

          <p class="grid1">Spin Speed (Min)</p>
          <input type="number" id="spinSpeedMin" class="grid2" min="0" v-model="live_app_data.spinSpeedMin" @input="(e) => {setField('spinSpeedMin', e.target.value)}" step="0.1">

          <p class="grid1">Spin Speed (Max)</p>
          <input type="number" id="spinSpeedMax" class="grid2" min="0" v-model="live_app_data.spinSpeedMax" @input="(e) => {setField('spinSpeedMax', e.target.value)}" step="0.1">

          <p class="grid1">Throw Angle (Min)</p>
          <input type="number" id="throwAngleMin" class="grid2" min="-90" v-model="live_app_data.throwAngleMin" @input="(e) => {setField('throwAngleMin', e.target.value)}" step="1">

          <p class="grid1">Throw Angle (Max)</p>
          <input type="number" id="throwAngleMax" class="grid2" max="90" v-model="live_app_data.throwAngleMax" @input="(e) => {setField('throwAngleMax', e.target.value)}" step="1">
        </div>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsView',
  props: ['app_data','app_status','app_game','game_data'],
  data : function() {
    return {
      live_app_data: this.app_data,
    }
  },
  methods: {
    setField(field, value) {
      this.$emit("set-field",{field:field, value:value});
    }
  },
  mounted() {
    this.$emit('unlock-game-change');
  },
}
</script>