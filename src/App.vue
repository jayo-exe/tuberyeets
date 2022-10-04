<template>
  <div id="app" class="wrapper">
    <div class="sidebar">
      <h2>TuberYeets</h2>
      <hr />
      <ul>
        <li>
          <router-link to="/">
            <a href="#" :class="{active: this.$route.name == 'library'}">Library</a>
          </router-link>
          <ul v-if="this.$route.name == 'library'">
            <li>
              <a href="#"
                 @click="setLibrarySection('ItemList')"
                 :class="{active: this.current_library_section == 'ItemList'}"
              >Items ({{ live_game_data.throws.length }})</a>
            </li>
            <li>
              <a href="#"
                 @click="setLibrarySection('SoundList')"
                 :class="{active: this.current_library_section == 'SoundList'}"
              >Sounds ({{ live_game_data.impacts.length }})</a>
            </li>
            <li>
              <a href="#"
                 @click="setLibrarySection('BonkList')"
                 :class="{active: this.current_library_section == 'BonkList'}"
              >Bonks ({{ Object.keys(live_game_data.customBonks).length }})</a>
            </li>
            <li>
              <a href="#"
                 @click="setLibrarySection('EventList')"
                 :class="{active: this.current_library_section == 'EventList'}"
              >CC Triggers ( {{ Object.keys(live_game_data.crowdControlEvents).length }})</a>
            </li>
          </ul>
        </li>
        <li>
          <router-link to="/calibration">
            <a href="#" :class="{active: this.$route.name == 'calibration'}" >Calibrate</a>
          </router-link>
        </li>
        <li>
          <router-link to="/settings">
            <a href="#" :class="{active: this.$route.name == 'settings'}" >Settings</a>
          </router-link>
        </li>
      </ul>
    </div>
    <div class="body-container">

      <div class="game-select">
        <!-- <img v-if="current_game.hasOwnProperty('game')" :src="current_game.game.media.thumbnail" style="max-width: 102px; max-height:140px; border: 1px solid #ddd; float: left; margin-right: 16px;" /> -->
        Choose Game:
        <select :disabled="game_data_loading" v-model="current_game.id" @change="setCrowdControlGame" style="font-size:0.85em;">
          <option v-for="(game, key) in games" :value="game.menuID">{{ game.name }}</option>
        </select>
        <i style="margin-left: 24px;" class="fa-solid fa-rotate refresh-game" @click="loadGameData()" v-b-tooltip.hover.left="'Reload Effect Pack'"></i>
        <i style="margin-left: 24px;" class="fa-solid fa-folder-open open-folder" @click="openGameFolder" v-b-tooltip.hover.left="'Delete files and import/export effect packs'"></i>
        <span style="padding-left: 24px;" v-if="current_game.hasOwnProperty('items')"><i class="fa-solid fa-right-left"></i> <strong>{{ current_game.items.length }}</strong> Crowd Control Effects</span>
        <span style="clear:both;"></span>
      </div>

      <router-view
          :app_data="live_app_data"
          :game_data="live_game_data"
          :vts_data="live_vts_data"
          :app_status="current_status"
          :app_game="current_game"
          :current_library_section="current_library_section"
          @set-library-section="setLibrarySection"
          @set-field="handleSetField"
          @update-data="saveData"
          @update-game-data="saveGameData"
      />



    </div>
    <div id="footer">
      <span style="padding-left: 8px;">
        Status:
        <span id="headerStatusInner" ref="status_label" :class="current_status.type + 'Text'"
              v-b-tooltip.hover.top="current_status.tooltip"
        >
          {{ current_status.title }}
        </span>
      </span>
      <div style="float:right;">
        <div class="main-status-icons">
          <i class="fa-solid fa-gamepad"
             :class="getIconStatusClass(autoGameSaveStatus)"
             v-b-tooltip.hover.left="'Game file: ' + autoGameSaveStatus"
          ></i>
          <i class="fa-solid fa-gear"
             :class="getIconStatusClass(autoSaveStatus)"
             v-b-tooltip.hover.left="'Settings file: ' + autoSaveStatus"
          ></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import axios from 'axios'

export default {
  data : function() {
    return {
      live_app_data: {},
      live_game_data: {},
      live_vts_data: {hotkeys:[],expressions:[]},
      user_data_path: '',
      current_status: {
        id: 0,
        title: "Ready!",
        description: "",
        type: "ready",
        param: null,
      },
      game_data_loading: false,
      current_game: {

      },
      current_library_section: "BonkList",
      games: {

      },
      statuses: [
        {
          id: 0,
          title: "Ready!",
          description: "",
          tooltip: "We're ready to go!",
          type: "ready",
          param: null,
        },
        {
          id: 1,
          title: "Connecting to CrowdControl...",
          description: "<p>We're currently connecting to Crowd Control</p>",
          tooltip: "We're currently connecting to Crowd Control",
          type: "working",
          param: null,
        },
        {
          id: 2,
          title: "Connecting to Browser Source...",
          description: "<p>If this message doesn't vanish after a few seconds, please refresh the 'TuberYeets Browser Source in OBS.</p><p>The 'TuberYeets Browser Source should be active with the following as the source URL:<br /><mark>file://[[param]]</mark></p>",
          tooltip: "If this message doesn't vanish after a few seconds, please refresh the 'TuberYeets Browser Source in OBS.",
          type: "working",
          param: "bonkerPath",
        },
        {
          id: 3,
          title: "Calibrating (1/2)",
          description: "<p>Please use VTube Studio to position your model's head under the guide being displayed in OBS.</p><p>Your VTube Studio Source and 'TuberYeets Browser Source should be overlapping.</p><p>Press the <mark>Continue Calibration</mark> button below to continue to the next step.</p>",
          tooltip: "We're currently calibrating the throw position",
          type: "working",
          param: null,
        },
        {
          id: 4,
          title: "Calibrating (2/2)",
          description: "<p>Please use VTube Studio to position your model's head under the guide being displayed in OBS.</p><p>Your VTube Studio Source and 'TuberYeets Browser Source should be overlapping.</p><p>Press the <mark>Confirm Calibration</mark> button below to finish calibration.</p>",
          tooltip: "We're currently calibrating the throw position",
          type: "working",
          param: null,
        },
        {
          id: 5,
          title: "Connecting Bonker to VTube Studio...",
          description: "<p>If this message doesn't disappear after a few seconds, please refresh the 'TuberYeets Browser Source.</p><p>If that doesn't work, please ensure the VTube Studio API is enabled on port <mark>[[param]]</mark>.</p>",
          tooltip: "The Browser Source is currently connecting to VTube Studio",
          type: "working",
          param: "portVTubeStudio",
        },
        {
          id: 6,
          title: "",
          description: "<p></p>",
          tooltip: "",
          type: "working",
          param: null,
        },
        {
          id: 7,
          title: "Calibration",
          description: "<p>This short process will decide the impact location of thrown objects.</p><p>Please click \"Start Calibration\" to start the calibration process.</p>",
          tooltip: "We're currently calibrating the throw position",
          type: "working",
          param: null,
        },
        {
          id: 8,
          title: "Connecting Bot to VTube Studio...",
          description: "<p></p>",
          tooltip: "We're currently connecting to VTube Studio",
          type: "working",
          param: null,
        },
        {
          id: 9,
          title: "Error: Port In Use",
          description: "<p>The port <mark>[[param]]</mark> is already in use. Another process may be using this port.</p><p>Try changing the Browser Source Port in Settings, under Advanced Settings.</p><p>It should be some number between 1024 and 65535.</p>",
          tooltip: "The selectedBrowser Source Port is already in use. Another process may be using this port.",
          type: "error",
          param: "portThrower",
        },
      ],
      autoSaveTimeout: null,
      autoSaveStatus: "unloaded",
      autoGameSaveTimeout: null,
      autoGameSaveStatus: "unloaded",
    }
  },
  methods: {
    loadData() {
      console.log('Loading Data...');
      window.ipc.send('LOAD_DATA', true);
    },
    saveData(event) {
      this.autoSaveStatus = "changed";
      this.live_app_data = event;
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = setTimeout(() => {
        this.autoSaveStatus = "saving";
        window.ipc.send('SAVE_DATA', this.live_app_data);
      },1000);

    },
    loadGameData() {
      console.log('Loading Game Data...');
      this.game_data_loading = true;
      window.ipc.send('LOAD_GAME_DATA', this.current_game.id);
    },
    getUserDataPath() {
      console.log('Getting Data Path...');
      window.ipc.send('GET_DATA_PATH', true);
    },
    saveGameData(event) {
      this.autoGameSaveStatus = "changed";
      this.game_data_loading = true;
      this.live_game_data = event;
      clearTimeout(this.autoGameSaveTimeout);
      this.autoSaveTimeout = setTimeout(() => {
        this.autoGameSaveStatus = "saving";
        window.ipc.send('SAVE_GAME_DATA', {game_id:this.current_game.id , data:this.live_game_data});
      },1000);
    },
    handleSetField(event) {
      this.setField(event.field, event.value);
    },
    setField(field,value) {
      console.log('Saving Field "'+field+'"...');
      window.ipc.send('SET_FIELD', [field, value]);
    },
    setStatus(message) {
      var status_id = message;
      this.statuses.forEach(app_status => {
        if (app_status.id == status_id) {
          this.current_status = {...app_status}
          if (app_status.param) {
            this.current_status.description = this.current_status.description.replace("[[param]]", this.live_app_data[app_status.param]);
          }
        }
      })
    },
    getCrowdControlGames() {
      axios.get("https://api.crowdcontrol.live/available_games")
          .then((response) => {
            this.games = response.data;
          })
          .catch(function (e) {
            console.log(e);
          });
    },
    setCrowdControlGame() {
      var game_id = this.current_game.id;
      console.log("Checking " + "https://api.crowdcontrol.live/menu/"+game_id);
      axios.get("https://api.crowdcontrol.live/menu/"+game_id).then(response => {
        console.log('setting selected game to '+response.data.menu.id);
        this.current_game = response.data.menu;

        this.live_app_data.last_game_id = game_id;
        this.autoSaveTimeout = setTimeout(() => {
          this.autoSaveStatus = "saving";
          window.ipc.send('SAVE_DATA', this.live_app_data);
        },1000);

        this.loadGameData();
        return true;
      }).catch(e => {console.log(e); return null; });
    },
    getIconStatusClass(status) {
      switch(status) {
        case 'ok (loaded)':
          return 'icon-ok';
          break;
        case 'ok (saved)':
          return 'icon-ok';
          break;
        case 'unloaded':
          return 'icon-error';
          break;
        case 'changed':
          return 'icon-notice';
          break;
        case 'saving':
          return 'icon-info';
          break;
        default:
          return 'icon-error';
      }
    },
    setLibrarySection(section_name) {
      this.current_library_section = section_name;
    },
    openGameFolder() {
      window.ipc.send("OPEN_GAME_FOLDER");
    }
  },

  mounted() {
    // handle reply from the backend
    window.ipc.on('GET_DATA_PATH', (payload) => {
      this.user_data_path =  payload;
      console.log('Data Path Loaded: ' + payload);
    });
    window.ipc.on('LOAD_DATA', (payload) => {
      this.live_app_data =  payload;
      this.current_game = {id: this.live_app_data.last_game_id};
      this.setCrowdControlGame();
      this.autoSaveStatus = "ok (loaded)";
      console.log('Data Loaded!');
    });
    window.ipc.on('SAVE_DATA', (payload) => {
      if(payload) {
        console.log('Data saved!');
        this.autoSaveStatus = "ok (saved)";
      } else {
        console.log('Error saving data!');
      }

    });
    window.ipc.on('LOAD_GAME_DATA', (payload) => {
      this.live_game_data =  payload;
      this.autoGameSaveStatus = "ok (loaded)";
      this.game_data_loading = false;
      console.log('Game Data Loaded!');
    });
    window.ipc.on('SAVE_GAME_DATA', (payload) => {
      if(payload) {
        console.log('Game Data saved!');
        this.autoGameSaveStatus = "ok (saved)";
      } else {
        console.log('Error saving game data!');
      }
      this.game_data_loading = false;
    });
    window.ipc.on('SET_FIELD', (payload) => {
      if(payload) {
        console.log('Field saved!');
      } else {
        console.log('Error saving field!');
      }
    });
    window.ipc.on('UPLOAD_THROW', (payload) => {
      var success = payload.success;
      if (success) {
        var throw_item = payload.throw_item;
        this.live_game_data.throws.unshift(throw_item);
        console.log('File uploaded!');
      } else {
        console.log('Error uploading file!');
      }
    });

    window.ipc.on('UPLOAD_IMPACT', (payload) => {
      var success = payload.success;
      if (success) {
        var impact_item = payload.impact_item;
        this.live_game_data.impacts.unshift(impact_item);
        console.log('File uploaded!');
      } else {
        console.log('Error uploading file!');
      }
    });

    window.ipc.on('UPLOAD_DECAL', (payload) => {
      console.log('Received Decal response');
      var success = payload.success;
      if (success) {
        var decal_item = payload.decal_item;
        console.log(this.live_game_data.customBonks[current_bonk]);
        this.live_game_data.customBonks[current_bonk].impactDecals.unshift(decal_item);
        console.log('File uploaded!');
      } else {
        console.log('Error uploading file!');
      }
    });

    window.ipc.on('UPLOAD_WINDUP', (payload) => {
      console.log('Received Windup response');
      var success = payload.success;
      if (success) {
        var windup_item = payload.windup_item;
        var current_bonk = payload.current_bonk;
        console.log(this.live_game_data.customBonks[current_bonk]);
        this.live_game_data.customBonks[current_bonk].windupSounds.unshift(windup_item);
        console.log('File uploaded!');
      } else {
        console.log('Error uploading file!');
      }
    });

    window.ipc.on('GET_VTS_EXPRESSIONS', (payload) => {
      console.log('Received VTS Expression response');
      var success = payload.success;
      if (success) {
        this.live_vts_data.expressions = payload.expressions;
      } else {
        console.log('Error fetching expressions!');
      }
    });

    window.ipc.on('GET_VTS_HOTKEYS', (payload) => {
      console.log('Received VTS Hotkey response');
      var success = payload.success;
      if (success) {
        this.live_vts_data.hotkeys = payload.hotkeys;
      } else {
        console.log('Error fetching hotkeys!');
      }
    });

    window.ipc.on('DELETE_THROW', (payload) => {
      if(payload) {
        console.log('Throw deleted!');
      } else {
        console.log('Error deleting throw!');
      }
    });
    window.ipc.on('STATUS', (payload) => {
      this.setStatus(payload);
    });
    this.getUserDataPath();
    this.loadData();
    this.getCrowdControlGames();
  },
}
</script>

<style>
#app {
  height: 100%;
  overflow: hidden;
}
</style>
