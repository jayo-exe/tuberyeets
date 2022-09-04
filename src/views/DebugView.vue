<template>
  <div id="mainBody" class="settings">
    <div id="wideWindow">
      <div id="wideWindowInner">
        <span class="tab firstTab selectedTab">Debug Screen</span>
        <div id="debug">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Event</th>
                <th>Last Update</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsView',
  props: ['app_data','app_status','app_game','game_data'],
  data : function() {
    return {
      live_app_data: this.app_data,
    }
  },
  methods: {
    setField(field, value) {
      this.$emit("set-field",{field:field, value:value});
    },
    updateData(data) {
      this.$emit("update-data",data);
    },
  },
  watch: {
    live_app_data: {
      handler: function(newVal, oldVal) {
        this.updateData(this.live_app_data);
      },
      deep: true
    }
  },
}
</script>