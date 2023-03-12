<template>
  <div id="app" class="wrapper">
    <header>
      <span class="app-title">TuberYeets</span>
      <div class="game-select">
        Choose Game:
        <select class="no-drag" :disabled="gameLocked" v-model="currentGameId" @change="setCrowdControlGame" style="font-size:0.85em; padding: 0px;">
          <option v-for="(game, key) in games" :value="game.menuID">{{ game.name }}</option>
        </select>
        <i style="margin-left: 24px;" class="fa-solid fa-folder-open open-folder no-drag" @click="openGameFolder" v-b-tooltip.hover.left="'Delete files and import/export effect packs'"></i>
        <span style="clear:both;"></span>
      </div>
    </header>
    <div class="app-body">
      <nav>
        <div class="menu-box">
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
                  >Items</a>
                </li>
                <li>
                  <a href="#"
                     @click="setLibrarySection('SoundList')"
                     :class="{active: this.current_library_section == 'SoundList'}"
                  >Sounds</a>
                </li>
                <li>
                  <a href="#"
                     @click="setLibrarySection('BonkList')"
                     :class="{active: this.current_library_section == 'BonkList'}"
                  >Bonks</a>
                </li>
                <li>
                  <a href="#"
                     @click="setLibrarySection('EventList')"
                     :class="{active: this.current_library_section == 'EventList'}"
                  >CC Triggers</a>
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
        <div class="menu-box bottom">
          <div class="agent-connections">
            <div v-for="(agent, key) in current_agent_status">
              <small><strong>{{agent.name}}</strong>: {{agent.status}}</small>
            </div>
          </div>
        </div>
      </nav>
      <main class="pl-0">
          <router-view
              :vts_data="live_vts_data"
              :agent_status="current_agent_status"
              :current_library_section="current_library_section"
              class="module-container"
              @set-library-section="setLibrarySection"
              @lock-game-change="lockGameChange"
              @unlock-game-change="unlockGameChange"
          />
      </main>
    </div>
    <footer>
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
      <div class="update-notification" style="float:right;">
          <span v-if="update_available && !update_downloaded" class="footer-update" >
            Update Available! Downloading...
          </span>
        <span v-if="update_downloaded" class="footer-update">
            Update Downloaded <a href="#" @click="restartAndInstall">Restart and Install</a>
          </span>
      </div>
    </footer>

    </div>
</template>

<script>
// @ is an alias to /src
import axios from 'axios'

export default {
  data : function() {
    return {

      live_vts_data: {hotkeys:[],expressions:[]},
      user_data_path: '',

      current_agent_status: {},
      gameLocked: false,
      update_available: false,
      update_downloaded: false,
      currentGame: {

      },
      currentGameId: 9,
      current_library_section: "ItemList",
      games: {

      },
      autoSaveTimeout: null,
      autoSaveStatus: "unloaded",
      autoGameSaveTimeout: null,
      autoGameSaveStatus: "ok (loaded)",
    }
  },
  methods: {
    getUserDataPath() {
      console.log('Getting Data Path...');
      window.ipc.send('GET_DATA_PATH', true);
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
      axios.get("https://api.crowdcontrol.live/menu/"+this.currentGameId).then(response => {
        console.log('setting selected game to '+response.data.menu.id);
        this.currentGame = response.data.menu;
        this.$appData.updateSync('last_game_id', this.currentGameId);
        window.ipc.send("SET_GAME", this.currentGameId);
        return true;
      }).catch(e => {console.log(e); return null; });
    },
    lockGameChange() {
      console.log('locking');
      this.gameLocked = true;
    },
    unlockGameChange() {
      console.log('unlocking');
      this.gameLocked = false;
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
    },
    checkForUpdate() {
      window.ipc.send('CHECK_UPDATE');
    },
    restartAndInstall() {
      window.ipc.send('RESTART');
    }
  },

  mounted() {
    // handle reply from the backend
    window.ipc.on('GET_DATA_PATH', (payload) => {
      this.user_data_path =  payload;
      console.log('Data Path Loaded: ' + payload);
    });

    window.ipc.on('SAVE_STATUS', (payload) => {
      if(payload) {
        this.autoSaveStatus = payload;
      } else {
        console.log('Error saving data!');
      }

    });

    window.ipc.on('LOAD_GAME_DATA', (payload) => {
      this.autoGameSaveStatus = "ok (loaded)";
      this.game_data_loading = false;
      console.log('Game Data Loaded!');
    });
    window.ipc.on('GAME_SAVE_STATUS', (payload) => {
      if(payload) {
        this.autoGameSaveStatus = payload;
        if(payload == "saving") { this.game_data_loading = true; }
        if(payload == "ok (saved)") { this.game_data_loading = false; }
      } else {
        console.log('Error saving game data!');
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
    window.ipc.on('AGENT_STATUS', (payload) => {
      this.current_agent_status = payload;
    });
    window.ipc.on('UPDATE_AVAILABLE', (payload) => {
      this.update_available = true;
    });
    window.ipc.on('UPDATE_DOWNLOADED', (payload) => {
      this.update_downloaded = true;
    });
    this.getUserDataPath();
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
