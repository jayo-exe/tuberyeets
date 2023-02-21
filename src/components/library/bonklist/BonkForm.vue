<template>
  <b-modal ref="editModal" scrollable size="xl">
    <template #modal-header="{ close }">
      <h5 class="modal-title">Edit Bonk - <span v-if="itemData">{{ itemData.name }}</span></h5>
      <button type="button" class="close" @click="finishEdit()">×</button>
    </template>
    <template #default>
      <div id="bonkDetails" v-if="itemData" class="row">
        <div class="col-12 mb-3">

        </div>

        <div class="col-6">
          <div class="mb-3">
            <h3 class="modal-subheading">Custom Bonk Name</h3>
            <hr>
            <input type="text" min="0" step="1" class="bonkName grid1-3" v-model="itemData.name" @input="updateItem('name')">
          </div>
          <div>
            <h3 class="modal-subheading">Gallery Overrides</h3>
            <hr>
            <div class="bonkDetailsTable">
              <label class="checkbox grid1">
                <input type="checkbox" class="itemsOverride"
                       v-model="itemData.itemsOverride"
                       @change="updateItem('itemsOverride')">
                <div class="checkHover"></div>
                <img src="ui/checkmark.png" class="checkmark">
              </label>
              <p class="grid2">Bonk Items <i class="fa fa-info-circle"
                                             v-b-tooltip.hover.left="'Select some thrown items that will be used in this Bonk'"
              ></i></p>
              <button class="images grid3 btn btn-blue"
                      @click="selectItems()"
                      :disabled="!itemData.itemsOverride"
              >Gallery</button>

              <label class="checkbox grid1">
                <input type="checkbox" class="soundsOverride"
                       v-model="itemData.soundsOverride"
                       @change="updateItem('soundsOverride')">
                <div class="checkHover"></div>
                <img src="ui/checkmark.png" class="checkmark">
              </label>
              <p class="grid2">Impact Sounds <i class="fa fa-info-circle"
                                                v-b-tooltip.hover.left="'Select some impact sounds that will be used in this Bonk'"
              ></i></p>
              <button class="sounds grid3 btn btn-blue"
                      @click="selectSounds()"
                      :disabled="!itemData.soundsOverride"
              >Gallery</button>

              <div v-if="false">
                <p class="grid2">Impact Decals <i class="fa fa-info-circle"
                                                  v-b-tooltip.hover.left="'Select some Impact Decals that will be used in this Bonk'"
                ></i></p>
                <button class="impactDecals grid3 btn btn-blue" @click="setSection('BonkDecals')">Gallery</button>

                <p class="grid2">Windup Sounds <i class="fa fa-info-circle"
                                                  v-b-tooltip.hover.left="'Select some Windup Sounds that will be used in this Bonk'"
                ></i></p>
                <button class="windupSounds grid3 btn btn-blue" @click="setSection('BonkWindups')">Gallery</button>
              </div>

            </div>
          </div>

        </div>
        <div class="col-6">
          <h3 class="modal-subheading">Setting Overrides</h3>
          <hr>
          <div class="bonkDetailsTable">
            <p class="grid2">Item Count <i class="fa fa-info-circle"
                                           v-b-tooltip.hover.left="'The number of items to throw.  This is ignored for events with a quantity'"
            ></i></p>
            <input type="number" min="0" step="1" class="barrageCount"
                   v-model="itemData.barrageCount"
                   @input="updateItem('barrageCount')">

            <label class="checkbox grid1">
              <input type="checkbox" class="throwAway"
                     v-model="itemData.throwAway"
                     @change="updateItem('throwAway')">
              <div class="checkHover"></div>
              <img src="ui/checkmark.png" class="checkmark">
            </label>
            <p class="grid2-3" >Throw Away <i class="fa fa-info-circle"
                                              v-b-tooltip.hover.left="'Throw items away instead of towards model'"
            ></i></p>

            <label class="checkbox grid1">
              <input type="checkbox" class="barrageFrequencyOverride"
                     v-model="itemData.barrageFrequencyOverride"
                     @change="updateItem('barrageFrequencyOverride')">
              <div class="checkHover"></div>
              <img src="ui/checkmark.png" class="checkmark">
            </label>
            <p class="grid2">Barrage Frequency (s) <i class="fa fa-info-circle"
                                                      v-b-tooltip.hover.left="'Average number of seconds between thrown items in a barrage'"
            ></i></p>
            <input type="number" min="0" step="1" class="barrageFrequency grid3"
                   v-model="itemData.barrageFrequency"
                   @input="updateItem('barrageFrequency')"
                   :disabled="!itemData.barrageFrequencyOverride"
            >

            <label class="checkbox grid1">
              <input type="checkbox" class="throwDurationOverride"
                     v-model="itemData.throwDurationOverride"
                     @change="updateItem('throwDurationOverride', e.target.checked)">
              <div class="checkHover"></div>
              <img src="ui/checkmark.png" class="checkmark">
            </label>
            <p class="grid2">Throw Duration <i class="fa fa-info-circle"
                                               v-b-tooltip.hover.left="'The number of seconds that a thrown item exists on the screen'"
            ></i></p>
            <input type="number" min="0" step="1" class="throwDuration grid3"
                   v-model="itemData.throwDuration"
                   @input="updateItem('throwDuration')"
                   :disabled="!itemData.throwDurationOverride"
            >

            <label class="checkbox grid1">
              <input type="checkbox" class="spinSpeedOverride"
                     v-model="itemData.spinSpeedOverride"
                     @change="updateItem('spinSpeedOverride')"
              >
              <div class="checkHover"></div>
              <img src="ui/checkmark.png" class="checkmark">
            </label>
            <p class="grid2">Spin Speed (Min) <i class="fa fa-info-circle"
                                                 v-b-tooltip.hover.left="'Minimum Spin Speed of thrown items'"
            ></i></p>
            <input type="number" min="0" step="1" class="spinSpeedMin grid3"
                   v-model="itemData.spinSpeedMin"
                   @input="updateItem('spinSpeedMin')"
                   :disabled="!itemData.spinSpeedOverride"
            >

            <p class="grid2">Spin Speed (Max) <i class="fa fa-info-circle"
                                                 v-b-tooltip.hover.left="'Maximum Spin Speed of thrown items'"
            ></i></p>
            <input type="number" min="0" step="1" class="spinSpeedMax grid3"
                   v-model="itemData.spinSpeedMax"
                   @input="updateItem('spinSpeedMax')"
                   :disabled="!itemData.spinSpeedOverride"
            >

            <label class="checkbox grid1">
              <input type="checkbox" class="throwAngleOverride"
                     v-model="itemData.throwAngleOverride"
                     @change="updateItem('throwAngleOverride')">
              <div class="checkHover"></div>
              <img src="ui/checkmark.png" class="checkmark">
            </label>
            <p class="grid2">Throw Angle (Min) <i class="fa fa-info-circle"
                                                  v-b-tooltip.hover.left="'Minimum Throw Angle for thrown items'"
            ></i></p>
            <input type="number" min="-90" step="1" class="throwAngleMin grid3"
                   v-model="itemData.throwAngleMin"
                   @input="updateItem('throwAngleMin')"
                   :disabled="!itemData.throwAngleOverride"
            >

            <p class="grid2">Throw Angle (Max) <i class="fa fa-info-circle"
                                                  v-b-tooltip.hover.left="'Maximum Throw Angle for thrown items'"
            ></i></p>
            <input type="number" min="90" step="1" class="throwAngleMax grid3"
                   v-model="itemData.throwAngleMax"
                   @input="updateItem('throwAngleMax')"
                   :disabled="!itemData.throwAngleOverride"
            >

            <p class="grid2">Windup Time (s) <i class="fa fa-info-circle"
                                                v-b-tooltip.hover.left="'Number of seconds of delay between a barrage being triggered and the first item being thrown'"
            ></i></p>
            <input type="number" min="0" class="windupDelay grid3"
                   v-model="itemData.windupDelay"
                   @input="updateItem('windupDelay')"
            >
          </div>
        </div>


      </div>
      <BonkImages ref="selectItems"></BonkImages>
      <BonkSounds ref="selectSounds"></BonkSounds>
    </template>
    <template #modal-footer="{ hide }">
      <b-button size="sm" variant="outline-secondary" @click="finishEdit()">
        Close
      </b-button>
    </template>
  </b-modal>
</template>

<script>
import BonkImages from '@/components/library/bonklist/BonkImages.vue'
import BonkDecals from '@/components/library/bonklist/BonkDecals.vue'
import BonkSounds from '@/components/library/bonklist/BonkSounds.vue'
import BonkWindups from '@/components/library/bonklist/BonkWindups.vue'

export default {
  name: 'BonkForm',
  props: [],
  components: {
    BonkImages,
    BonkDecals,
    BonkSounds,
    BonkWindups
  },
  data : function() {
    return {
      libraryType: "customBonks",
      libraryName: "Bonk",
      itemId: null,
      itemData: null,
      gameDataPath: '',
      itemListSection: "BonkList"
    }
  },
  methods: {
    open(itemId) {
      this.itemId = itemId;
      this.getItemData();
      this.$refs['editModal'].show();
    },

    finishEdit() {
      this.$refs['editModal'].hide();
      this.$emit("finish-edit");
    },

    getItemData() {
      this.$gameData.read(`${this.libraryType}.${this.itemId}`).then((result) => {
        this.$set(this, "itemData", result);
      });

    },

    updateItem(field) {
      let itemId = this.itemId;
      this.$gameData.update(`${this.libraryType}.${itemId}.${field}`, this.itemData[field]).then((success) => {
        if(!success) console.log(`updateItem failed for ${this.libraryName} ${itemId}`);
      });
    },

    selectItems() {
      this.$refs['selectItems'].open(this.itemId);
    },
    selectSounds() {
      this.$refs['selectSounds'].open(this.itemId);
    },
  },
  mounted() {
    this.gameDataPath = this.$gameData.readSync('game_data_path');
  },
}
</script>