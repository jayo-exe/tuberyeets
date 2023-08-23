<template>
  <div class="settings-form-grid" v-if="agent_details && agent_settings" :key="agent_status">
    <div class="form-group mb-0" style="grid-template-rows: auto;">
      <label class="form-label">Crowd Control Auth</label>
      <div class="form-input" style="height: auto;">
        <div v-if="!token_data">
          <button class="btn btn-sm btn-teal w-100 mb-1" @click="authorizeCrowdControl()"><i class="fa-solid fa-lock-open"></i> Authorize</button>
        </div>
        <div v-else>
          <button class="btn btn-sm btn-red w-100" @click="deauthorizeCrowdControl()">Deauthorize</button>
        </div>
      </div>
      <div class="form-help-text">
        <span v-if="!token_data">Select a connected service to authorize Crowd Control</span>
        <span v-else>Authorized as <strong>{{ token_data.name }}</strong> via <strong>{{ token_data.profileType }}</strong></span>
      </div>
    </div>
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
  name: 'CrowdControlSettings',
  props: ['agent_status', 'agent_details', 'agent_settings'],
  data: function () {
    let token_data = null;
    if (this.agent_settings.token !== '') {
      try {
        token_data = JSON.parse(atob(this.agent_settings.token.split('.')[1]));
      } catch (e) {
        console.log(`couldn't parse CC token!`);
      }
    }
    return {
      agent_key: this.agent_details.key,
      live_agent_settings: this.agent_settings,
      token_data: token_data,
      auth_service: token_data ? token_data.profileType : 'twitch'
    }
  },
  watch: {
    agent_status: {
      handler(newValue, oldValue) {
        this.reloadAgentSettings();
      }
    }
  },
  methods: {
    updateSettings() {
      this.$emit('update-settings', this.agent_key, this.live_agent_settings)
    },
    restartAgent() {
      this.$emit('restart-agent', this.agent_key)
    },
    reloadAgentSettings() {
      this.$appData.getAgentSettings(this.agent_key).then((result) => {
        this.$set(this, 'live_agent_settings', result);
        console.log(`Reloaded Agency Settings Data for ${this.agent_details.name}!`);
        if (this.live_agent_settings.token !== '') {
          try {
            this.token_data = JSON.parse(atob(this.live_agent_settings.token.split('.')[1]));
            console.log(`parsed CC token!`, this.token_data);
          } catch (e) {
            console.log(`couldn't parse CC token!`);
          }
        }
      });
    },
    deauthorizeCrowdControl() {
      this.$set(this.live_agent_settings, 'token', '');
      this.token_data = null;
      this.updateSettings();
      this.restartAgent();
    },
    authorizeCrowdControl() {
      window.ipc.send('BEGIN_CC_AUTH');
      this.updateSettings();
    }
  }
}
</script>