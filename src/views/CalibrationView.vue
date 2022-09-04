<template>
  <div id="mainBody" class="calibration">
    <div id="wideWindow">
      <div id="wideWindowInner">
        <span class="tab firstTab selectedTab">Calibration</span>
        <div id="statusWindow">
          <h2 id="status">{{ app_status.title }}</h2>
          <div id="statusDesc" v-html="app_status.description"></div>
          <div id="calibrateButtons" v-if="calibration_statuses.includes(app_status.id)">
            <div id="nextCalibrate" class="topButton" @click="nextCalibrate">
              <div class="overlayButton"></div>
              <div class="innerTopButton">
                <template v-if="app_status.id==7">START CALIBRATION</template>
                <template v-else-if="app_status.id==3">CONTINUE CALIBRATION</template>
                <template v-else-if="app_status.id==4">CONFIRM CALIBRATION</template>
              </div>
              <div class="cornerTopButton"></div>
            </div>
            <div id="cancelCalibrate" class="topButton" @click="cancelCalibrate">
              <div class="overlayButton"></div>
              <div class="innerTopButton">CANCEL</div>
              <div class="cornerTopButton"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'CalibrationView',
  props: ['app_data','app_status','app_game','game_data'],
  data : function() {
    return {
      live_app_data: this.app_data,
      calibration_statuses: [3,4,7]
    }
  },
  methods: {
    setField(field, value) {
      this.$emit("set-field",{field:field, value:value});
    },
    updateData(data) {
      this.$emit("update-data",data);
    },
    startCalibrate() {
      console.log('Starting Calibration');
      window.ipc.send('CALIBRATE_START');
    },
    nextCalibrate() {
      console.log('Progressing Calibration');
      window.ipc.send('CALIBRATE_NEXT');
    },
    cancelCalibrate() {
      console.log('Cancelling Calibration');
      window.ipc.send('CALIBRATE_CANCEL');
    }
  },
  mounted: function() {
    this.startCalibrate();
  },
  beforeDestroy() {
    this.cancelCalibrate();
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