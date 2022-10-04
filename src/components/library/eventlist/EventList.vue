<template>
  <div>
    <h2>Triggers</h2>

    <div id="events" class="body-panel">
      <h3>Crowd Control Triggers</h3>
      <button class="btn btn-green add-btn" @click="addEvent">Add Trigger</button>
      <hr>
      <div id="eventsTable" class="imageTable">
        <table class="listTable">
          <thead>
          <tr>
            <th>Trigger Name</th>
            <th>Triggered By</th>
            <th style="width: 140px;">Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(cc_event, key) in live_game_data.crowdControlEvents" :key="'bcb_'+key">
            <td>
              <p class="imageLabel">{{ cc_event.name }}</p>
            </td>
            <td>
              <p style="margin: 0">{{ getEffectName(cc_event.crowdControlEffect) }}</p>
            </td>
            <td>
              <button class="btn btn-green" @click="editEvent(key)">Edit</button>
              <button class="btn btn-red" @click="removeEvent(key)">Delete</button>
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
  name: 'EventList',
  props: ['app_data','app_game','game_data','current_event'],
  data : function() {
    return {
      live_app_data: this.app_data,
      live_game_data: this.game_data,
    }
  },
  methods: {
    addEvent()
    {
      var newEventNumber = 1;
      var crowdControlEvents = this.live_game_data.crowdControlEvents;
      if (crowdControlEvents == null)
        crowdControlEvents = {};

      while (crowdControlEvents["Custom_Event_" + newEventNumber] != null)
        newEventNumber++;

      this.$set(this.live_game_data.crowdControlEvents, "Custom_Event_" + newEventNumber, {
        "name": "Custom Event " + newEventNumber,
        "enabled": true,
        "triggerName": null,
        "crowdControlEffect": null,
        "triggerType": null,
        "bonkEnabled": false,
        "bonkType": "single",
        "hotkeyEnabled": false,
        "hotkeyName": null,
        "secondHotkeyEnabled": false,
        "secondHotkeyName": null,
        "secondHotkeyDelay": 2500,
        "hotkeySync":true,
        "expressionEnabled": false,
        "expressionName": null,
        "expressionDuration": 1000,
        "expressionSync":true,
      });


    },
    editEvent(item_index) {
      this.$emit("edit-cc-event",item_index);
    },
    removeEvent(item_index) {
      if(confirm("are you sure you want to remove this Crowd Control Event?")) {
        var item_sound = this.live_game_data.crowdControlEvents[item_index].location;
        this.$delete(this.live_game_data.crowdControlEvents,item_index);
      }
    },
    updateGameData() {
      this.$emit("update-game-data",this.live_game_data);
    },
    getEffectName(bid) {
      var effect_name = "None";
      this.app_game.items.forEach(cc_effect => {
        if(cc_effect.bid == bid) {
          effect_name = cc_effect.name;
        }
      });
      return effect_name;
    }
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