<template>
  <div id="mainBody" class="library">

        <component
            v-bind:is="current_library_section"
            :app_data="app_data"
            :game_data="game_data"
            :app_game="app_game"
            :vts_data="vts_data"
            :current_item="current_item"
            :current_bonk="current_bonk"
            :current_event="current_event"
            @update-game-data="updateGameData"
            @set-section="setSection"
            @edit-item="editItem"
            @edit-custom-bonk="editCustomBonk"
            @edit-cc-event="editCustomEvent"
        ></component>
  </div>
</template>

<script>
// @ is an alias to /src
import BonkList from '@/components/library/bonklist/BonkList.vue'
import BonkForm from '@/components/library/bonklist/BonkForm.vue'
import BonkImages from '@/components/library/bonklist/BonkImages.vue'
import BonkDecals from '@/components/library/bonklist/BonkDecals.vue'
import BonkSounds from '@/components/library/bonklist/BonkSounds.vue'
import BonkWindups from '@/components/library/bonklist/BonkWindups.vue'
import EventList from '@/components/library/eventlist/EventList.vue'
import EventForm from '@/components/library/eventlist/EventForm.vue'
import ItemList from '@/components/library/itemlist/ItemList.vue'
import ItemForm from '@/components/library/itemlist/ItemForm.vue'
import SoundList from '@/components/library/soundlist/SoundList.vue'


export default {
  name: 'LibraryView',
  props: ['app_data','app_status','game_data','vts_data','app_game', 'current_library_section'],
  components: {
    BonkList,
    BonkForm,
    BonkImages,
    BonkDecals,
    BonkSounds,
    BonkWindups,
    EventList,
    EventForm,
    ItemList,
    ItemForm,
    SoundList
  },
  data : function() {
    return {
      live_app_data: this.app_data,
      live_game_data: this.game_data,
      live_vts_data: this.vts_data,
      current_item: 0,
      current_bonk: 0,
      current_event: 0,
    }
  },
  methods: {
    setSection(section_name) {
      this.$emit('set-library-section', section_name);
    },
    editItem(item_id) {
      this.current_item = item_id;
      this.setSection("ItemForm");
    },
    editCustomBonk(bonk_id) {
      this.current_bonk = bonk_id;
      this.setSection("BonkForm");
    },
    editCustomEvent(event_id) {
      this.current_event = event_id;
      this.setSection("EventForm");
    },
    setField(field, value) {
      this.$emit("set-field",{field:field, value:value});
    },
    updateGameData(data) {
      this.$emit('update-game-data', data);
    },
  },
  mounted() {

  },
}
</script>