<template>
  <div id="eventDetails">
    <h2>Edit Crowd Control Event</h2>
    <span class="btn btn-red back-btn" @click="setSection('EventList')">Back</span>
    <div class="body-panel">
      <h3>CC Trigger Details</h3>
      <hr>
      <div class="eventDetailsTable">
        <label class="checkbox grid1">
          <input type="checkbox" class="eventEnabled" v-model="live_game_data.crowdControlEvents[current_event].enabled">
          <div class="checkHover"></div>
          <img src="ui/checkmark.png" class="checkmark">
        </label>
        <p class="grid2">Event Enabled</p>

        <p class="grid2">Custom Event Name</p>
        <input type="text" class="eventName grid3" v-model="live_game_data.crowdControlEvents[current_event].name">

        <p class="grid2">Crowd Control Effect</p>
        <select class="crowdControlEffect grid3" v-model="live_game_data.crowdControlEvents[current_event].crowdControlEffect" @change="updateCrowdControlEffect">
          <template v-for="(effect_group, group_key) in app_game.items" >
            <optgroup v-if="effect_group.hasOwnProperty('kind') && effect_group.kind == 2" :label="effect_group.name" :key="'ccelg'+group_key">
              <option  v-for="(effect, key) in app_game.items" v-if="effect.hasOwnProperty('p') && effect.p == effect_group.bid" :value="effect.bid" :key="'ccel'+key">{{ effect.name }}</option>
            </optgroup>
          </template>
          <optgroup label="Ungrouped">
            <option  v-for="(effect, key) in app_game.items" v-if="!effect.hasOwnProperty('p') && !effect.hasOwnProperty('kind')" :value="effect.bid" :key="'ccel'+key">{{ effect.name }}</option>
          </optgroup>

        </select>
      </div>
    </div>


    <div class="body-panel" style="margin-bottom:0">
      <h3>CC Trigger Actions</h3>
      <hr>
      <div class="eventDetailsTable">
        <table class="listTable">
          <thead>
          <tr>
            <th>Enabled</th>
            <th>Starts at (ms)</th>
            <th>Action</th>
            <th>Value</th>
            <th>Duration (ms)</th>
            <th colspan="2">Sync with Timed</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>
              <label class="checkbox">
                <input type="checkbox" class="bonkEnabled" v-model="live_game_data.crowdControlEvents[current_event].bonkEnabled">
                <div class="checkHover"></div>
                <img src="ui/checkmark.png" class="checkmark">
              </label>
            </td>
            <td>0</td>
            <td>
              Custom Bonk
            </td>
            <td>
              <select class="bonkType grid3" v-model="live_game_data.crowdControlEvents[current_event].bonkType">
                <option :value="null">-- No Bonk Selected --</option>
                <option v-for="(custom_bonk, key) in live_game_data.customBonks" :value="key" :key="'vtsh'+key">{{ custom_bonk.name }}</option>
              </select>
            </td>
            <td></td>
            <td colspan="2">Always</td>

          </tr>
          <tr>
            <td>
              <label class="checkbox">
                <input type="checkbox" class="hotkeyEnabled" v-model="live_game_data.crowdControlEvents[current_event].hotkeyEnabled">
                <div class="checkHover"></div>
                <img src="ui/checkmark.png" class="checkmark">
              </label>
            </td>
            <td>0</td>
            <td>Trigger Hotkey 1 <i class="fa fa-info-circle"
                                    v-b-tooltip.hover.left="'Trigger a VTube Studio hotkey with this effect'"
            ></i></td>
            <td>
              <select class="hotkeyName grid3" v-model="live_game_data.crowdControlEvents[current_event].hotkeyName">
                <option :value="null">-- No Hotkey Selected --</option>
                <option v-for="(hotkey, key) in live_vts_data.hotkeys" :value="hotkey" :key="'vtsh1'+key">{{ hotkey }}</option>
              </select>
            </td>
            <td></td>
            <td></td>
            <td style="width: 36px;">
              <i class="fa fa-info-circle"
                 v-b-tooltip.hover.left="'For timed effects, Hotkey 1 is triggered when the effect starts, and Hotkey 2 is triggered when the effect stops'"
              ></i>
            </td>
          </tr>
          <tr>
            <td>
              <label class="checkbox">
                <input type="checkbox" class="secondHotkeyEnabled" v-model="live_game_data.crowdControlEvents[current_event].secondHotkeyEnabled">
                <div class="checkHover"></div>
                <img src="ui/checkmark.png" class="checkmark">
              </label>
            </td>
            <td>
              <input type="number" min="0" value="60000" step="1" style="width:100px" v-model="live_game_data.crowdControlEvents[current_event].secondHotkeyDelay">
            </td>
            <td>
              Trigger Hotkey 2 <i class="fa fa-info-circle"
                                  v-b-tooltip.hover.left="'Trigger a second hotkey after some time.  Typically used to reverse the effects of the first hotkey'"
            ></i>
            </td>
            <td>
              <select class="secondHotkeyName" v-model="live_game_data.crowdControlEvents[current_event].secondHotkeyName">
                <option :value="null">-- No Hotkey Selected --</option>
                <option v-for="(hotkey, key) in live_vts_data.hotkeys" :value="hotkey" :key="'vtsh2'+key">{{ hotkey }}</option>
              </select>
            </td>
            <td></td>
            <td>
              <label class="checkbox grid1">
                <input type="checkbox" class="hotkeySync" v-model="live_game_data.crowdControlEvents[current_event].hotkeySync">
                <div class="checkHover"></div>
                <img src="ui/checkmark.png" class="checkmark">
              </label>
            </td>
            <td style="width: 36px;">
              <i class="fa fa-info-circle"
                 v-b-tooltip.hover.left="'For timed effects, Hotkey 1 is triggered when the effect starts, and Hotkey 2 is triggered when the effect stops'"
              ></i>
            </td>
          </tr>
          <tr>
            <td>
              <label class="checkbox grid1">
                <input type="checkbox" class="expressionEnabled" v-model="live_game_data.crowdControlEvents[current_event].expressionEnabled">
                <div class="checkHover"></div>
                <img src="ui/checkmark.png" class="checkmark">
              </label>
            </td>
            <td>0</td>
            <td>Activate an Expression <i class="fa fa-info-circle"
                                          v-b-tooltip.hover.left="'activate an expression on the vTube model'"
            ></i></td>
            <td>
              <select class="expressionName grid3" v-model="live_game_data.crowdControlEvents[current_event].expressionName">
                <option :value="null">-- No Expression Selected --</option>
                <option v-for="(expression, key) in live_vts_data.expressions" :value="expression" :key="'vtse'+key">{{ expression }}</option>
              </select>
            </td>
            <td>
              <input type="number" min="0" value="60000" step="1" style="width:100px" v-model="live_game_data.crowdControlEvents[current_event].expressionDuration">
            </td>
            <td>
              <label class="checkbox grid1">
                <input type="checkbox" class="expressionSync" v-model="live_game_data.crowdControlEvents[current_event].expressionSync">
                <div class="checkHover"></div>
                <img src="ui/checkmark.png" class="checkmark">
              </label>
            </td>
            <td style="width: 36px;">
              <i class="fa fa-info-circle"
                 v-b-tooltip.hover.left="'For timed effects, enabled and disabling the expression will be triggered by start, pause, resume, and stop events'"
              ></i>
            </td>
          </tr>

          </tbody>
        </table>


      </div>

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