<template>
  <div id="app" class="wrapper">
    <header class="app-header">
      <span class="app-title"><i class="fa-solid fa-dumpster-fire"></i> TuberYeets</span>
    </header>
    <div class="app-body">
      <nav>
        <div class="menu-box">
          <ul class="main-list">
            <li>
              <a href="javascript:;" @click="() => { showOverlayAssets = this.$route.path.indexOf('/overlay') !== 0 ? !showOverlayAssets : showOverlayAssets }">
                <i class="fa-solid fa-palette"></i> Overlay Assets
              </a>
            </li>
            <li class="sub-item" v-if="showOverlayAssets || this.$route.path.indexOf('/overlay') === 0">
              <router-link to="/overlay/items">
                <i class="fa-solid fa-baseball"></i> Items
              </router-link>
            </li>
            <li class="sub-item" v-if="showOverlayAssets || this.$route.path.indexOf('/overlay') === 0">
              <router-link to="/overlay/sounds" >
                <i class="fa-solid fa-music"></i> Sounds
              </router-link>
            </li>
            <li class="sub-item" v-if="showOverlayAssets || this.$route.path.indexOf('/overlay') === 0">
              <router-link to="/overlay/item-groups">
                <i class="fa-solid fa-layer-group"></i> Item Groups
              </router-link>
            </li>
            <li>
              <router-link to="/triggers">
                <i class="fa-solid fa-bolt"></i> Triggers
              </router-link>
            </li>
            <li>
              <router-link to="/calibration">
                <i class="fa-solid fa-crosshairs"></i> Calibrate
              </router-link>
            </li>
            <li>
              <router-link to="/settings">
                <i class="fa-solid fa-gear"></i> Settings
              </router-link>
            </li>
          </ul>
        </div>
        <div class="menu-box bottom">
          <div class="agent-connections">
            <div v-for="(agent, key) in current_agent_status" class="agent-status">
              <i :id="agent.key+'-icon'" class="fa-solid fa-circle-check" style="color: var(--cc-color-t300)" v-if="agent.status === 'connected'"></i>
              <i :id="agent.key+'-icon'" class="fa-solid fa-circle-xmark" style="color: var(--cc-color-r200)" v-else-if="agent.status === 'disconnected'"></i>
              <i :id="agent.key+'-icon'" class="fa-solid fa-circle-exclamation" style="color: var(--cc-color-w300)" v-else-if="agent.status === 'disabled'"></i>
              <i :id="agent.key+'-icon'" class="fa-solid fa-circle-dot" style="color: var(--cc-color-y300)" v-else></i>
              <b-tooltip :target="agent.key+'-icon'" triggers="hover" placement="right">
                {{agent.status}}
              </b-tooltip>
              <span> {{agent.name}}</span>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <router-view
            :vts_data="live_vts_data"
            :agent_status="current_agent_status"
            :calibrate_status="current_calibrate_status"
            :current_library_section="current_library_section"
            class="module-container"
            @set-library-section="setLibrarySection"
            @lock-game-change="lockGameChange"
            @unlock-game-change="unlockGameChange"
        />
      </main>
    </div>
    <footer class="d-flex flex-row">
      <div class="game-select col-9 pl-1">
        <span class="d-flex flex-row" id="game-select-wrapper" style="margin-top: 4px;" v-if="games">
          <div class="col-8 px-0 d-flex flex-row">
            <b-tooltip v-if="gameLocked" target="game-select-wrapper" triggers="hover" placement="bottom">
              <i class="fa-solid fa-lock"></i> Game selection is locked while browsing game-specific sections
            </b-tooltip>
            <i style="padding:6px; float: left;" class="fa-solid fa-folder-open open-folder no-drag" @click="openGameFolder" v-b-tooltip.hover.left="'Delete files and import/export effect packs'"></i>
            <v-select v-model="currentGameId"
              class="no-drag mr-2"
              style="width: 100%;"
              append-to-body
              :calculate-position="withPopper"
              :clearable="false"
              :disabled="gameLocked"
              :options="games"
              :label="'name'"
              :reduce="game => game.gameID"
              @input="selectNewGame"
            >
              <template v-slot:option="option">
                <div class="d-flex" style="align-items: center">
                  <div class="my-1 mr-2 p-0 text-center">
                    <div style="height:48px">
                      <img style="max-height: 48px;"
                           :src="`https://resources.crowdcontrol.live/images/${option.gameID}/box.jpg`">
                    </div>
                  </div>
                  <div style="white-space: break-spaces; text-align: center; flex: 1">
                    <small class="cc-fs-sm" >{{ option.name }}</small>
                  </div>
                </div>
              </template>

            </v-select>
          </div>

          <div class="col-4 px-0">
            <v-select v-model="currentGamePackId"
                      v-if="currentGame.length > 1"
                      class="no-drag"
                      append-to-body
                      :calculate-position="withPopper"
                      :clearable="false"
                      :disabled="gameLocked"
                      :options="currentGame"
                      :get-option-label="pack => pack.meta.name"
                      :reduce="pack => pack.gamePackID"
                      @input="selectNewPack"
            ></v-select>
          </div>
        </span>
        <span style="clear:both;"></span>
      </div>
      <div class="col-3 pr-0">
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
      </div>
    </footer>

  </div>
</template>

<script>
// @ is an alias to /src
import axios from 'axios'
import { createPopper } from '@popperjs/core'

export default {
  data : function() {
    return {
      showOverlayAssets:false,
      live_vts_data: {hotkeys:[],expressions:[]},
      user_data_path: '',

      current_agent_status: {},
      current_calibrate_status: -2,
      gameLocked: false,
      update_available: false,
      update_downloaded: false,
      libraryDropdown: false,
      currentGame: [],
      currentPack: {},
      currentGameId: "SuperMario64",
      currentGamePackId: "SuperMario64",
      current_library_section: "ItemList",
      games: null,
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
    getCrowdControlGamesNew() {
      axios.get("https://openapi.crowdcontrol.live/games")
          .then((response) => {
            this.games = Object.values(response.data).filter(game => game.hasOwnProperty('name') && typeof game.name !== 'object');
            console.log(this.games);
          })
          .catch(function (e) {
            console.log(e);
          });
    },

    selectNewGame() {
      this.currentGamePackId = null;
      this.setCrowdControlGame();
    },

    selectNewPack() {
      this.setCrowdControlGame();
    },

    setCrowdControlGame() {
      window.ipc.send("SET_GAME", {gameId: this.currentGameId, packId: this.currentGamePackId});
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
    getCrowdControlGame() {
      window.ipc.send('GET_GAME');
    },
    restartAndInstall() {
      window.ipc.send('RESTART');
    },
    withPopper(dropdownList, component, { width }) {
      console.log(component.$refs.toggle);
      dropdownList.style.width = width

      const popper = createPopper(component.$refs.toggle, dropdownList, {
        placement: 'top',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, -1],
            },
          },
          {
            name: 'toggleClass',
            enabled: true,
            phase: 'write',
            fn({ state }) {
              component.$el.classList.toggle(
                  'drop-up',
                  state.placement === 'top'
              )
            },
          },
        ],
      })

      return () => popper.destroy()
    },
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

    window.ipc.on('GET_GAME', (payload) => {
      if(payload) {
        console.log('Game Pack Loading...',payload);
        this.currentGameId = payload.gameId;
        this.currentGamePackId = payload.packId;
        this.currentGame = payload.packs;
        this.currentPack = this.currentGame.find((gamePack) => gamePack.gamePackID === this.currentGamePackId);
      } else {
        console.log('Error Setting Game Pack!');
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
    window.ipc.on('CALIBRATE_STATUS', (payload) => {
      this.current_calibrate_status = payload;
    });
    window.ipc.on('UPDATE_AVAILABLE', (payload) => {
      this.update_available = true;
    });
    window.ipc.on('UPDATE_DOWNLOADED', (payload) => {
      this.update_downloaded = true;
    });
    this.getUserDataPath();
    this.getCrowdControlGamesNew();
    this.getCrowdControlGame();
  },
}
</script>

<style>
#app {
  height: 100%;
  overflow: hidden;
}
</style>
