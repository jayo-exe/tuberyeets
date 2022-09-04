<template>
  <div id="events">
    <span id="imagesDefaultTab" class="tab firstTab selectedTab" style="width:180px;">Crowd Control Events</span>
    <span id="imagesDefaultTab" class="tab folderTab"><a @click="openGameFolder" v-b-tooltip.hover.left="'Delete files and import/export effect packs'">Open Game Folder</a></span>
    <div id="eventsTable" class="imageTable">
      <div id="eventsAdd" class="new row" @click="addEvent">
        <div class="imageRowShadow">
          <div class="imageRowInner">
            <img class="imageImage" src="ui/add.png"></img>
            <p class="imageLabel">ADD EVENT</p>
            <div class="imageRowHover"></div>
          </div>
        </div>
      </div>
      <div v-for="(cc_event, key) in live_game_data.crowdControlEvents" class="row ccEventRow" :key="'bcb_'+key">
        <div class="imageRowShadow">
          <div class="imageRowInner">
            <img class="imageImage eventDetailsButton" src="ui/cog64.png" @click="editEvent(key)" v-b-tooltip.hover.top="'Edit'"></img>
            <p class="imageLabel">{{ cc_event.name }}</p>
            <label class="delete">
              <button class="imageRemove" @click="removeEvent(key)"></button>
              <img src="ui/x.png" class="checkmark" v-b-tooltip.hover.left="'Remove'"></img>
            </label>
            <div class="imageRowHover"></div>
          </div>
        </div>
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
    openGameFolder() {
      window.ipc.send("OPEN_GAME_FOLDER");
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