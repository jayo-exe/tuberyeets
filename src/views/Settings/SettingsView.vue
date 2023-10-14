<template>
  <div class="d-flex">
    <section id="settings" style="flex: 1">
      <div class="section-heading">
        <div class="section-title">
          <h3>Settings</h3>
          <span>Manage settings related to TuberYeets and integrated services</span>
        </div>
      </div>
      <div class="section-body inner scrollable" style="overflow-y:auto;">
        <div class="section-panel mt-3" v-for="(agent, key) in agent_details" v-if="agent_settings[key] && key !== 'enabled'">
          <div class="section-heading">
            <div class="section-title">
              <h5>{{ agent.name }}</h5>
              <span class="cc-fs-sm">{{ agent.description }}</span>
            </div>
            <div class="ml-auto">
              <div class="mb-1 text-right">
                <i class="fa-solid fa-circle-check" style="color: var(--cc-color-t300)" v-if="agent_status[agent.key].status === 'connected'"></i>
                <i class="fa-solid fa-circle-xmark" style="color: var(--cc-color-r200)" v-else-if="agent_status[agent.key].status === 'disconnected'"></i>
                <i class="fa-solid fa-circle-exclamation" style="color: var(--cc-color-w300)" v-else-if="agent_status[agent.key].status === 'disabled'"></i>
                <i class="fa-solid fa-circle-dot" style="color: var(--cc-color-y300)" v-else></i>
                <span> {{agent_status[agent.key].status}}</span>
              </div>
              <div class="text-right">
                <button v-if="agent_settings[agent.key].enabled && agent_changed[agent.key]" :disabled="agent_processing[agent.key]" class="btn btn-blurple btn-sm mr-2" @click="restartAgent(agent.key)">Restart</button>
                <button v-if="agent_settings[agent.key].enabled" :disabled="agent_processing[agent.key]" class="btn btn-red btn-sm" @click="disableAgent(agent.key)">Disable</button>
                <button v-if="!agent_settings[agent.key].enabled" :disabled="agent_processing[agent.key]" class="btn btn-teal btn-sm" @click="enableAgent(agent.key)">Enable</button>
              </div>
            </div>
          </div>

          <component :is="agent.settingsForm"
                     :agent_status="agent_status[agent.key].status"
                     :agent_settings="agent_settings[agent.key]"
                     :agent_details="agent_details[agent.key]"
                     @update-settings="updateSettings"
                     @restart-agent="restartAgent"
          ></component>

        </div>
      </div>
    </section>
  </div>
</template>

<script>
import CrowdControlSettings from '@/views/Settings/CrowdControlSettings.vue'
import OverlaySettings from '@/views/Settings/OverlaySettings.vue'
import VtubeStudioSettings from '@/views/Settings/VtubeStudioSettings.vue'
import DefaultSettings from '@/views/Settings/DefaultSettings.vue'

export default {
  name: 'SettingList',
  props: ['agent_status'],
  components: {
    CrowdControlSettings,
    OverlaySettings,
    VtubeStudioSettings,
    DefaultSettings
  },
  data : function() {
    return {
      agent_details: {},
      agent_settings: {},
      agent_processing: {},
      agent_changed: {},
    }
  },
  methods: {
    loadAgentsData() {
      this.$appData.getAgentDetails().then((result) => {
        this.agent_details = result;
        console.log('Got Agency Settings Structure!');
        for (const [key, agent] of Object.entries(this.agent_details)) {
          this.agent_processing[key] = false;
          this.agent_changed[key] = false;
          this.loadAgentSettings(key);
        }
      });
    },
    loadAgentSettings(agentKey) {
      this.$appData.getAgentSettings(agentKey).then((result) => {
        this.$set(this.agent_settings,agentKey,result);
        console.log(`Got Agency Settings Data for ${this.agent_details[agentKey].name}!`);
      });
    },
    updateSettings(agentKey, newSettings) {
      this.$appData.update(`agents.${agentKey}`, newSettings).then((result) => {
        this.agent_changed[agentKey] = true;
        this.loadAgentSettings(agentKey);
        this.$forceUpdate();
        console.log(`Updated Agency Settings Data for ${this.agent_details[agentKey].name}!`);
      });
    },
    enableAgent(agentKey) {
      this.agent_processing[agentKey] = true;
      this.$appData.enableAgent(agentKey).then((success) => {
        this.agent_processing[agentKey] = false;
        if(success) {
          console.log(`Agent ${agentKey} was activated!`);
          this.agent_settings[agentKey].enabled = true;
        } else {
          console.log(`Agent ${agentKey} failed to activate!`);
          this.agent_settings[agentKey].enabled = false;
        }
      });
    },
    disableAgent(agentKey) {
      this.agent_processing[agentKey] = true;
      this.$appData.disableAgent(agentKey).then((success) => {
        this.agent_processing[agentKey] = false;
        if(success) {
          console.log(`Agent ${agentKey} was deactivated!`);
          this.agent_settings[agentKey].enabled = false;
        } else {
          console.log(`Agent ${agentKey} failed to deactivate!`);
          this.agent_settings[agentKey].enabled = true;
        }
      });
    },
    restartAgent(agentKey) {
      this.agent_processing[agentKey] = true;
      this.$appData.restartAgent(agentKey).then((success) => {
        this.agent_processing[agentKey] = false;
        if(success) {
          console.log(`Agent ${agentKey} was reloaded!`);
          this.agent_changed[agentKey] = true;
          this.loadAgentSettings(agentKey);
        } else {
          console.log(`Agent ${agentKey} failed to reload!`);
        }
      });
    },
  },
  mounted() {
    this.loadAgentsData();
    this.$emit('unlock-game-change');
  },

}
</script>