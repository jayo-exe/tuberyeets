<template>
  <div>
    <h2>App Settings</h2>
    <div id="mainBody" class="settings">

      <div class="body-panel">
        <h3>Connection Details</h3>
        <hr>
        <div class="settingsBlock">
          <p class="grid1">Browser Source Port</p>
          <input type="number" id="portThrower" class="grid2" v-model="live_app_data.portThrower">
          <small class="grid3">Requires restart to take effect.</small>

          <p class="grid1">VTube Studio Port</p>
          <input type="number" id="portVTubeStudio" v-model="live_app_data.portVTubeStudio">
          <small class="grid3">Requires restart to take effect.</small>

          <p class="grid1">Crowd Control Channel</p>
          <input type="text" id="cc_channel" class="grid2" v-model="live_app_data.cc_channel">
          <small class="grid3">Requires restart to take effect.</small>

        </div>
      </div>

      <div class="body-panel">
        <h3>Model Settings</h3>
        <hr>
        <div class="settingsBlock">
          <p class="grid1">Global Volume</p>
          <input type="range" id="volume" class="grid2" min="0" max="1" v-model="live_app_data.volume" step="0.1">

          <p class="grid1">Item Scale (At Min Model Size)</p>
          <input type="number" id="itemScaleMin" class="grid2" min="0" v-model="live_app_data.itemScaleMin">

          <p class="grid1">Item Scale (At Max Model Size)</p>
          <input type="number" id="itemScaleMax" class="grid2" min="0" v-model="live_app_data.itemScaleMax">

          <p class="grid1">Impact Delay (ms)</p>
          <input type="number" id="delay" class="grid2" min="0" v-model="live_app_data.delay">

          <p class="grid1">Model Return Speed</p>
          <input type="number" id="returnSpeed" class="grid2" min="0" v-model="live_app_data.returnSpeed">

          <p class="grid1">Close Eyes on Hit</p>
          <label class="checkbox grid2">
            <input type="checkbox" id="closeEyes" v-model="live_app_data.closeEyes">
            <div class="checkHover"></div>
            <img src="ui/checkmark.png" class="checkmark">
          </label>

          <p class="grid1">Open Eyes on Hit</p>
          <label class="checkbox grid2">
            <input type="checkbox" id="openEyes" v-model="live_app_data.openEyes">
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
          <input type="number" id="barrageCount" class="grid2" min="0" v-model="live_app_data.barrageCount">

          <p class="grid1">Barrage Frequency (s)</p>
          <input type="number" id="barrageFrequency" class="grid2" min="0" v-model="live_app_data.barrageFrequency">

          <p class="grid1">Throw Duration</p>
          <input type="number" id="throwDuration" class="grid2" min="0.1" v-model="live_app_data.throwDuration">

          <p class="grid1">Spin Speed (Min)</p>
          <input type="number" id="spinSpeedMin" class="grid2" min="0" v-model="live_app_data.spinSpeedMin" step="0.1">

          <p class="grid1">Spin Speed (Max)</p>
          <input type="number" id="spinSpeedMax" class="grid2" min="0" v-model="live_app_data.spinSpeedMax" step="0.1">

          <p class="grid1">Throw Angle (Min)</p>
          <input type="number" id="throwAngleMin" class="grid2" min="-90" v-model="live_app_data.throwAngleMin" step="1">

          <p class="grid1">Throw Angle (Max)</p>
          <input type="number" id="throwAngleMax" class="grid2" max="90" v-model="live_app_data.throwAngleMax" step="1">
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
    },
    updateData(data) {
      this.$emit("update-data",data);
    },
  },
  watch: {
    live_app_data: {
      handler: function(newVal, oldVal) {
        this.updateData(this.live_app_data);
      },
      deep: true
    }
  },
}
</script>