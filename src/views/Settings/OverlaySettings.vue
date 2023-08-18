<template>
  <div class="settings-form-grid" v-if="agent_details && agent_settings">
    <div class="form-group" v-for="(setting, key) in agent_details.settings" v-if="setting.settable">
      <label class="form-label">{{ `${setting.label}` }}</label>
      <template v-if="setting.type === 'groupedList'">
        <select class="form-input" v-model="live_agent_settings[setting.key]" @change="updateSettings">
          <optgroup v-for="(settingOptionGroup, groupIndex) in setting.options" :key="'comg_'+groupIndex" :label="settingOptionGroup.group">
            <option v-for="(settingOption, optionIndex) in settingOptionGroup.items" :key="'como_'+optionIndex" :value="settingOption.value">
              {{ `${settingOptionGroup.group}: ${settingOption.label}` }}
            </option>
          </optgroup>
        </select>
      </template>
      <template v-else-if="setting.type === 'list'">
        <select class="form-input" v-model="live_agent_settings[setting.key]" @change="updateSettings">
          <option v-for="(settingOption, optionIndex) in setting.options" :key="'como_'+optionIndex" :value="settingOption.value">
            {{ settingOption.label }}
          </option>
        </select>
      </template>
      <template v-else-if="setting.type === 'toggle'">
        <input type="checkbox" class="form-input" v-model="live_agent_settings[setting.key]" @change="updateSettings" >
      </template>
      <template v-else-if="setting.type === 'number'">
        <input type="number" :step="setting.step ?? 1" :min="setting.min ?? ''" :max="setting.max ?? ''" class="form-input" v-model="live_agent_settings[setting.key]" @input="updateSettings">
      </template>
      <template v-else-if="setting.type === 'text'">
        <input type="text" class="form-input" v-model="live_agent_settings[setting.key]" @input="updateSettings">
      </template>
      <template v-else-if="setting.type === 'password'">
        <input type="password" class="form-input" v-model="live_agent_settings[setting.key]" @input="updateSettings">
      </template>
      <template v-else>
        <input type="text" class="form-input" v-model="live_agent_settings[setting.key]" @input="updateSettings">
      </template>
      <div class="form-help-text" v-if="setting.help" >{{ setting.help }}</div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'OverlaySettings',
  props: ['agent_status', 'agent_details', 'agent_settings'],
  data: function () {
    return {
      agent_key: this.agent_details.key,
      live_agent_settings: this.agent_settings,
    }
  },
  methods: {
    updateSettings() {
      this.$emit('update-settings', this.agent_key, this.live_agent_settings)
    },
  }
}
</script>