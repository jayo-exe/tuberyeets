<template>
  <b-modal ref="editModal" scrollable size="xl">
    <template #modal-header="{ close }">
      <h5 class="modal-title">Edit Item Group - <span v-if="itemGroupData">{{ itemGroupData.name }}</span></h5>
      <button type="button" class="close" @click="finishEdit()"><i class="fa-solid fa-xmark"></i></button>
    </template>
    <template #default class="d-flex flex-column">
      <div id="itemGroupDetails" v-if="itemGroupData && itemList && soundList" class="row flex-grow-1">
        <div class="col-8 d-flex flex-column">
          <section class="mb-3">
            <div class="section-heading mb-0">
              <div class="section-title">
                <h5>Item Group Name</h5>
              </div>
            </div>
            <input type="text" min="0" step="1" class="itemGroupName grid1-3" v-model="itemGroupData.name" @input="updateItem('name')">
          </section>
          <section class="flex-grow-1">
            <div class="section-heading mb-0">
              <div class="section-title">
                <h5>Overlay Assets</h5>
              </div>
            </div>
            <div class="row">
              <div class="overlay-items-holder col-6">
                <h5>Items</h5>
                <v-select v-model="selectedItem"
                          class="mb-2"
                          placeholder="Select an Item"
                          @input="selectItem(selectedItem)"
                          :options="Object.values(itemList).filter(item => !itemGroupData.items.includes(item.id))"
                          label="name"
                          :reduce="item => item.id"
                >
                  <template v-slot:option="option">
                    <div class="d-flex">
                      <div class="mr-2 pl-0 ml-n1 text-center">
                        <div style="width:32px;height:32px">
                          <img style="max-height: 32px; max-width: 32px;"
                               :src="`file://${gameDataPath}/items/${option.location}`">
                        </div>
                      </div>
                      <div class="text-right" style="overflow-x:hidden; text-overflow:ellipsis; white-space:nowrap">
                        <small class="cc-fs-sm" >{{ option.name }}</small>
                      </div>
                    </div>
                  </template>
                </v-select>
                <ul class="group-item-list">
                  <li v-for="(itemKey) in itemGroupData.items" v-if="itemList.hasOwnProperty(itemKey)">
                    <img class="item-image" :src="`file://${gameDataPath}/items/${itemList[itemKey].location}`">
                    <div class="item-name">{{ itemList[itemKey].name }}</div>
                    <a class="remove-item" href="javascript:;" @click="deselectItem(itemKey)"><i class="fa-solid fa-xmark"></i></a>
                  </li>
                </ul>
              </div>
              <div class="overlay-sounds-holder col-6">
                <h5>Sounds</h5>
                <v-select v-model="selectedSound"
                          class="mb-2"
                          placeholder="Select a Sound"
                          @input="selectSound(selectedSound)"
                          :options="Object.values(soundList).filter(sound => !itemGroupData.sounds.includes(sound.id))"
                          label="location"
                          :reduce="sound => sound.id"
                >
                  <template v-slot:option="option">
                    <div class="d-flex">
                      <div class="mr-2 pl-0 ml-n1 text-center">
                        <i class="sound-icon fa-solid fa-volume-high" style="font-size:29px; color: var(--cc-color-w300)"></i>

                      </div>
                      <div class="text-right" style="overflow-x:hidden; text-overflow:ellipsis; white-space:nowrap">
                        <small class="cc-fs-sm" >{{ option.location }}</small>
                      </div>
                    </div>
                  </template>
                </v-select>
                <ul class="group-sound-list">
                  <li v-for="(soundKey) in itemGroupData.sounds" v-if="soundList.hasOwnProperty(soundKey)">
                    <i class="sound-icon fa-solid fa-volume-high"></i>
                    <div class="sound-name">{{ soundList[soundKey].location }}</div>
                    <a class="remove-item" href="javascript:;" @click="deselectSound(soundKey)"><i class="fa-solid fa-xmark"></i></a>
                  </li>
                </ul>
              </div>
            </div>

          </section>

        </div>
        <div class="col-4 d-flex flex-column">
          <section class="flex-grow-1">
            <div class="section-heading mb-0">
              <div class="section-title">
                <h5>Setting Overrides</h5>
              </div>
            </div>
            <div class="itemGroupDetailsTable">
              <p class="grid2">Item Count <i class="fa fa-info-circle"
                                             v-b-tooltip.hover.left="'The number of items to throw.  This is ignored for events with a quantity'"
              ></i></p>
              <input type="number" min="0" step="1" class="groupCount"
                     v-model="itemGroupData.groupCount"
                     @input="updateItem('groupCount')">

              <label class="grid1">
                <input type="checkbox"
                       v-model="itemGroupData.throwAway"
                       @change="updateItem('throwAway')">
              </label>
              <p class="grid2-3" >Throw Away <i class="fa fa-info-circle"
                                                v-b-tooltip.hover.left="'Throw items away instead of towards model'"
              ></i></p>

              <label class="grid1">
                <input type="checkbox"
                       v-model="itemGroupData.groupFrequencyOverride"
                       @change="updateItem('groupFrequencyOverride')">
              </label>

              <p class="grid2">
                Group Frequency (s)
                <i class="fa fa-info-circle"
                   v-b-tooltip.hover.left="'Average number of seconds between thrown items in a group'"></i>
              </p>
              <input type="number" min="0" step="0.01" class="groupFrequency grid3"
                     v-model="itemGroupData.groupFrequency"
                     @input="updateItem('groupFrequency')"
                     :disabled="!itemGroupData.groupFrequencyOverride"
              >

              <label class="grid1">
                <input type="checkbox" class="throwDurationOverride"
                       v-model="itemGroupData.throwDurationOverride"
                       @change="updateItem('throwDurationOverride')">
              </label>
              <p class="grid2">Throw Duration <i class="fa fa-info-circle"
                                                 v-b-tooltip.hover.left="'The number of seconds that a thrown item exists on the screen'"
              ></i></p>
              <input type="number" min="0" step="0.01" class="throwDuration grid3"
                     v-model="itemGroupData.throwDuration"
                     @input="updateItem('throwDuration')"
                     :disabled="!itemGroupData.throwDurationOverride"
              >

              <label class="grid1">
                <input type="checkbox" class="spinSpeedOverride"
                       v-model="itemGroupData.spinSpeedOverride"
                       @change="updateItem('spinSpeedOverride')"
                >
              </label>
              <p class="grid2">Spin Rate (Min) <i class="fa fa-info-circle"
                                                   v-b-tooltip.hover.left="'Minimum Spin Rate of thrown items'"
              ></i></p>
              <input type="number" min="0" step="0.1" class="spinSpeedMin grid3"
                     v-model="itemGroupData.spinSpeedMin"
                     @input="updateItem('spinSpeedMin')"
                     :disabled="!itemGroupData.spinSpeedOverride"
              >

              <p class="grid2">Spin Rate (Max) <i class="fa fa-info-circle"
                                                   v-b-tooltip.hover.left="'Maximum Spin Rate of thrown items'"
              ></i></p>
              <input type="number" min="0" step="0.1" class="spinSpeedMax grid3"
                     v-model="itemGroupData.spinSpeedMax"
                     @input="updateItem('spinSpeedMax')"
                     :disabled="!itemGroupData.spinSpeedOverride"
              >

              <label class="grid1">
                <input type="checkbox" class="throwAngleOverride"
                       v-model="itemGroupData.throwAngleOverride"
                       @change="updateItem('throwAngleOverride')">
              </label>
              <p class="grid2">Angle (Min) <i class="fa fa-info-circle"
                                                    v-b-tooltip.hover.left="'Minimum Throw Angle for thrown items'"
              ></i></p>
              <input type="number" min="-90" step="1" class="throwAngleMin grid3"
                     v-model="itemGroupData.throwAngleMin"
                     @input="updateItem('throwAngleMin')"
                     :disabled="!itemGroupData.throwAngleOverride"
              >

              <p class="grid2">Angle (Max) <i class="fa fa-info-circle"
                                                    v-b-tooltip.hover.left="'Maximum Throw Angle for thrown items'"
              ></i></p>
              <input type="number" min="90" step="1" class="throwAngleMax grid3"
                     v-model="itemGroupData.throwAngleMax"
                     @input="updateItem('throwAngleMax')"
                     :disabled="!itemGroupData.throwAngleOverride"
              >

              <p class="grid2">Windup Time (s) <i class="fa fa-info-circle"
                                                  v-b-tooltip.hover.left="'Number of seconds of delay between a barrage being triggered and the first item being thrown'"
              ></i></p>
              <input type="number" min="0" step="0.1" class="windupDelay grid3"
                     v-model="itemGroupData.windupDelay"
                     @input="updateItem('windupDelay')"
              >
            </div>
          </section>


        </div>


      </div>
    </template>
    <template #modal-footer="{ hide }">
      <b-button size="sm" variant="outline-secondary" @click="finishEdit()">
        Close
      </b-button>
    </template>
  </b-modal>
</template>

<script>


export default {
  name: 'ItemGroupForm',
  props: [],
  components: {

  },
  data : function() {
    return {
      libraryType: "itemGroups",
      libraryName: "Item Group",
      itemId: null,
      itemGroupData: null,
      itemList:{},
      selectedItem: '',
      soundList:{},
      selectedSound: '',
      gameDataPath: '',
    }
  },
  methods: {
    open(itemId) {
      this.itemId = itemId;
      this.getItemGroupData();
      this.$refs['editModal'].show();
    },

    finishEdit() {
      this.$refs['editModal'].hide();
      this.$emit("finish-edit");
    },

    getItemGroupData() {
      this.$gameData.read(`${this.libraryType}.${this.itemId}`).then((result) => {
        this.$set(this, "itemGroupData", result);
      });
      this.listItems();
      this.listSounds();
    },

    updateItem(field) {
      let itemId = this.itemId;
      this.$gameData.update(`${this.libraryType}.${itemId}.${field}`, this.itemGroupData[field]).then((success) => {
        if(!success) console.log(`updateItem failed for ${this.libraryName} ${itemId}`);
      });
    },

    selectItem(itemId) {
      if(!this.itemGroupData.items.includes(itemId)) {
        this.itemGroupData.items.push(itemId);
        this.updateItem('items');
      }
      this.selectedItem = '';
    },
    deselectItem(itemId) {
      if(this.itemGroupData.items.includes(itemId)) {
        this.itemGroupData.items.splice(this.itemGroupData.items.indexOf(itemId),1);
        this.updateItem('items');
      } else {
        console.log(`Can't deselect ${itemId} from item group`, this.itemGroupData.items)
      }
    },

    getItemPath(filename) {
      let gameDataPath = this.$gameData.readSync('game_data_path');
      return `${gameDataPath}/sounds/${filename}`;
    },
    listItems() {
      this.$set(this, "itemList", null);
      this.$forceUpdate();
      this.$gameData.read(`items`).then((result) => {
        this.$set(this, "itemList", result);
      });
    },
    selectSound(soundId) {
      if(!this.itemGroupData.sounds.includes(soundId)) {
        this.itemGroupData.sounds.push(soundId);
        this.updateItem('sounds');
      }
      this.selectedSound = '';
    },
    deselectSound(soundId) {
      if(this.itemGroupData.sounds.includes(soundId)) {
        this.itemGroupData.sounds.splice(this.itemGroupData.sounds.indexOf(soundId),1);
        this.updateItem('sounds');
      } else {
        console.log(`Can't deselect ${soundId} from item group`, this.itemGroupData.sounds)
      }
    },
    getSoundPath(filename) {
      let gameDataPath = this.$gameData.readSync('game_data_path');
      return `${gameDataPath}/sounds/${filename}`;
    },
    listSounds() {
      this.$set(this, "soundList", null);
      this.$forceUpdate();
      this.$gameData.read(`sounds`).then((result) => {
        this.$set(this, "soundList", result);
      });
    },
  },
  mounted() {
    this.listItems();
    this.listSounds();
    this.gameDataPath = this.$gameData.readSync('game_data_path');
  },
}
</script>