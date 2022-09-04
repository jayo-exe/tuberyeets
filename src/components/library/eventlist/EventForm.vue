<template>
  <div id="eventDetails">
    <span class="windowCorner"></span>
    <span class="windowBack" @click="setSection('EventList')">BACK</span>
    <div id="eventDetailsTable">

      <div class="header">
        <div class="headerInner">
          Custom Event Name
        </div>
      </div>

      <p class="grid2">Custom Event Name</p>
      <input type="text" class="eventName grid1-3" v-model="live_game_data.crowdControlEvents[current_event].name">


      <label class="checkbox grid1">
        <input type="checkbox" class="eventEnabled" v-model="live_game_data.crowdControlEvents[current_event].enabled">
        <div class="checkHover"></div>
        <img src="ui/checkmark.png" class="checkmark">
      </label>
      <p class="grid2">Event Enabled</p>

      <div class="header">
        <div class="headerInner">
          Incoming Event
        </div>
      </div>

      <p class="grid2">Crowd Control Effect</p>
      <select class="crowdControlEffect grid3" v-model="live_game_data.crowdControlEvents[current_event].crowdControlEffect" @change="updateCrowdControlEffect">
        <option v-for="(effect, key) in app_game.items" :value="effect.bid" :key="'ccel'+key">{{ effect.name }}</option>
      </select>

      <div class="header">
        <div class="headerInner">
          Actions
        </div>
      </div>

      <label class="checkbox grid1">
        <input type="checkbox" class="bonkEnabled" v-model="live_game_data.crowdControlEvents[current_event].bonkEnabled">
        <div class="checkHover"></div>
        <img src="ui/checkmark.png" class="checkmark">
      </label>
      <p class="grid2">Use a Custom Bonk</p>
      <template v-if="live_game_data.crowdControlEvents[current_event].bonkEnabled">
        <p class="grid2">Custom Bonk Name</p>
        <select class="bonkType grid3" v-model="live_game_data.crowdControlEvents[current_event].bonkType">
          <option v-for="(custom_bonk, key) in live_game_data.customBonks" :value="key" :key="'vtsh'+key">{{ custom_bonk.name }}</option>
        </select>
      </template>

      <label class="checkbox grid1" style="margin-top: 24px;">
        <input type="checkbox" class="hotkeyEnabled" v-model="live_game_data.crowdControlEvents[current_event].hotkeyEnabled">
        <div class="checkHover"></div>
        <img src="ui/checkmark.png" class="checkmark">
      </label>
      <p class="grid2" style="margin-top: 24px;">Trigger a Hotkey <i class="fa fa-info-circle"
                                                                     v-b-tooltip.hover.left="'Trigger a VTube Studio hotkey with this effect'"
      ></i></p>

      <template v-if="live_game_data.crowdControlEvents[current_event].hotkeyEnabled">
        <p class="grid2">Hotkey Name</p>
        <select class="hotkeyName grid3" v-model="live_game_data.crowdControlEvents[current_event].hotkeyName">
          <option v-for="(hotkey, key) in live_vts_data.hotkeys" :value="hotkey" :key="'vtsh1'+key">{{ hotkey }}</option>
        </select>

        <label class="checkbox grid1" style="margin-top: 24px;">
          <input type="checkbox" class="secondHotkeyEnabled" v-model="live_game_data.crowdControlEvents[current_event].secondHotkeyEnabled">
          <div class="checkHover"></div>
          <img src="ui/checkmark.png" class="checkmark">
        </label>
        <p class="grid2" style="margin-top: 24px;">Trigger a second Hotkey <i class="fa fa-info-circle"
                                                                              v-b-tooltip.hover.left="'Trigger a second hotkey after some time.  Typically used to reverse the effects of the first hotkey'"
        ></i></p>

        <template v-if="live_game_data.crowdControlEvents[current_event].secondHotkeyEnabled">
          <p class="grid2">Second Hotkey Name</p>
          <select class="secondHotkeyName grid3" v-model="live_game_data.crowdControlEvents[current_event].secondHotkeyName">
            <option v-for="(hotkey, key) in live_vts_data.hotkeys" :value="hotkey" :key="'vtsh2'+key">{{ hotkey }}</option>
          </select>

          <p class="grid2">Second Hotkey Delay (ms)</p>
          <input type="number" min="0" value="60000" step="1" class="secondHotkeyDelay grid3" v-model="live_game_data.crowdControlEvents[current_event].secondHotkeyDelay">

          <label class="checkbox grid1" style="margin-top: 24px;">
            <input type="checkbox" class="hotkeySync" v-model="live_game_data.crowdControlEvents[current_event].hotkeySync">
            <div class="checkHover"></div>
            <img src="ui/checkmark.png" class="checkmark">
          </label>
          <p class="grid2" style="margin-top: 24px;">Sync Hotkeys with Timed Effects <i class="fa fa-info-circle"
                                                                                        v-b-tooltip.hover.left="'For timed effects, enabled and disabling the expression will be triggered by start and stop events'"
          ></i></p>
        </template>
      </template>

      <label class="checkbox grid1" style="margin-top: 24px;">
        <input type="checkbox" class="expressionEnabled" v-model="live_game_data.crowdControlEvents[current_event].expressionEnabled">
        <div class="checkHover"></div>
        <img src="ui/checkmark.png" class="checkmark">
      </label>
      <p class="grid2" style="margin-top: 24px;">Activate an Expression <i class="fa fa-info-circle"
                                                                           v-b-tooltip.hover.left="'activate an expression on the vTube model'"
      ></i></p>

      <template v-if="live_game_data.crowdControlEvents[current_event].expressionEnabled">
        <p class="grid2">Expression Name</p>
        <select class="expressionName grid3" v-model="live_game_data.crowdControlEvents[current_event].expressionName">
          <option v-for="(expression, key) in live_vts_data.expressions" :value="expression" :key="'vtse'+key">{{ expression }}</option>
        </select>

        <p class="grid2">Expression Duration (ms) <i class="fa fa-info-circle"
                                                     v-b-tooltip.hover.left="'Deactivate the expression after this amount of time'"
        ></i></p>
        <input type="number" min="0" value="60000" step="1" class="expressionDuration grid3" v-model="live_game_data.crowdControlEvents[current_event].expressionDuration">

        <label class="checkbox grid1" style="margin-top: 24px;">
          <input type="checkbox" class="expressionSync" v-model="live_game_data.crowdControlEvents[current_event].expressionSync">
          <div class="checkHover"></div>
          <img src="ui/checkmark.png" class="checkmark">
        </label>
        <p class="grid2" style="margin-top: 24px;">Sync Expression with Timed Effects <i class="fa fa-info-circle"
                                                                                         v-b-tooltip.hover.left="'For timed effects, enabled and disabling the expression will be triggered by start, pause, resume, and stop events'"
        ></i></p>
      </template>


    </div>
  </div>
</template>

<script>
// @ is an alias to /src
//import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'EventForm',
  props: ['app_data','app_game','game_data','current_event','vts_data'],
  data : function() {
    return {
      live_app_data: this.app_data,
      live_game_data: this.game_data,
      live_vts_data: this.vts_data,
    }
  },
  methods: {
    setSection(section_name) {
      this.$emit("set-section",section_name);
    },
    updateGameData() {
      this.$emit("update-game-data",this.live_game_data);
    },
    getVTSExpressions() {
      window.ipc.send("GET_VTS_EXPRESSIONS");
    },
    getVTSHotkeys() {
      window.ipc.send("GET_VTS_HOTKEYS");
    },
    updateCrowdControlEffect(event) {
      const effect_bid = this.live_game_data.crowdControlEvents[this.current_event].crowdControlEffect;
      this.app_game.items.forEach(item => {
        if(item.bid == effect_bid) {
          this.live_game_data.crowdControlEvents[this.current_event].triggerName = item.safeName;
          return true;
        }
      });
    }
  },
  mounted() {
    this.getVTSExpressions();
    this.getVTSHotkeys();
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
    vts_data: {
      handler: function() { this.live_vts_data = this.vts_data},
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