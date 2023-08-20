<template>
  <div class="d-flex">
    <section id="calibration" style="flex: 1">
      <div class="section-heading">
        <div class="section-title">
          <h3 class="cc-h5">Overlay Calibration</h3>
          <span></span>
        </div>
        <div class="ml-auto">
          <button class="btn btn-sm btn-blurple ml-1" @click="copyOverlayLink">Copy Overlay Link</button>
        </div>
      </div>
      <div>
        <div v-if="status_details.hasOwnProperty(calibrate_status)">
          <h2 id="status">{{ status_details[calibrate_status].title }}</h2>
          <div class="mb-3" id="statusDesc" v-html="status_details[calibrate_status].description"></div>
        </div>
        <div id="calibrateButtons">
          <button @click="nextCalibrate" class="mb-3 btn btn-blurple" v-if="calibrate_status==0">Continue Calibration</button>
          <button @click="nextCalibrate" class="mb-3 btn btn-blurple" v-if="calibrate_status==2">Complete Calibration</button>
          <button @click="startCalibrate" class="mb-3 btn btn-teal" v-if="calibrate_status==-2 || calibrate_status==4">Start Calibration</button>
          <button @click="cancelCalibrate" class="mb-3 btn btn-red" v-else>Cancel Calibration</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'CalibrationView',
  props: ['calibrate_status'],
  data : function() {
    return {
      overlayPath: '',
      calibrarion_status: -2,
      live_app_data: this.app_data,
      calibration_statuses: [3,4,7],
      status_details: {
        "-2": {title: "Undetermined", description:"Calibration is in an undetermined state"},
        "-1": {title: "Preparing", description:"Measuring current model position"},
        "0": {title: "Setting Target: Smallest", description:"Indicate where items should be land as the model gets <small>smaller</small><br />Move your model <strong>without resizing it</strong> so that the target overlaps your desired point of impact"},
        "1": {title: "Measure Small", description:"Recording the measurement at the smallest model size"},
        "2": {title: "Setting Target: Largest", description:"Now, show where items should be aimed when the model gets <span style=\"font-size: 1.2rem;\">larger</span>.<br />Move your model <strong>without resizing it</strong> so that the target overlaps your desired point of impact"},
        "3": {title: "Measure Large", description:"Recording the measurement at the largest model size"},
        "4": {title: "Complete", description:"Calibration is finished or cancelled"},
      }
    }
  },
  methods: {
    setField(field, value) {
      this.$emit("set-field",{field:field, value:value});
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
    },
    copyOverlayLink() {
        navigator.clipboard.writeText(this.overlayPath);
        setTimeout(() => { alert('Overlay Link has been copied to your clipboard!') }, 500);
    }
  },
  mounted: function() {
    this.cancelCalibrate();
    this.$emit('unlock-game-change');
    this.$appData.getOverlayPath().then((result) => {
      this.overlayPath = result;
      console.log('BOOP', this.overlayPath);
    });
  },
  beforeDestroy() {
    this.cancelCalibrate();
  }
}
</script>