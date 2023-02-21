<template>
  <div id="mainBody" class="library">

        <component
            v-bind:is="current_library_section"
            :vts_data="vts_data"
            :current_item="current_item"
            @set-section="setSection"
            @edit-item="editItem"
        ></component>
  </div>
</template>

<script>
// @ is an alias to /src
import BonkList from '@/components/library/bonklist/BonkList.vue'


import EventList from '@/components/library/eventlist/EventList.vue'
import EventForm from '@/components/library/eventlist/EventForm.vue'
import ItemList from '@/components/library/itemlist/ItemList.vue'

import SoundList from '@/components/library/soundlist/SoundList.vue'


export default {
  name: 'LibraryView',
  props: ['app_data','app_status','game_data','vts_data','app_game', 'current_library_section'],
  components: {
    BonkList,
    EventList,
    EventForm,
    ItemList,
    SoundList
  },
  data : function() {
    return {
      live_app_data: this.app_data,
      live_game_data: this.game_data,
      live_vts_data: this.vts_data,
      current_item: 0,

    }
  },
  methods: {
    setSection(section_name) {
      this.$emit('set-library-section', section_name);
    },
    editItem(section, item_id) {
      this.current_item = item_id;
      this.setSection(section);
    },
  },
  mounted() {
    this.$emit('lock-game-change');
  },
}
</script>