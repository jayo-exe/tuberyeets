module.exports = class TimedEffectAgent {

    constructor(data,vts,gdh,game_data_path,overlaySocket,crowdControlEffect,effectHandler) {
        this.data = data;
        this.vts = vts;
        this.gdh = gdh;
        this.game_data_path = game_data_path
        this.overlaySocket = overlaySocket;
        this.crowdControlEffect = crowdControlEffect;
        this.effectHandler = effectHandler;
        this.durationRemaining = crowdControlEffect.effect.duration;
        this.bonkTimer = null;
        this.bonkBuffer = [];
        this.bonkBufferIndex = 0;
    }

    start() {
        console.log("Starting timed effect");
        if(this.effectHandler.bonkEnabled && this.effectHandler.bonkType.length > 0) {
            this.throw();
        }

        //Activate selected expression (and setup deactivation timer of not synced)
        if(this.effectHandler.expressionEnabled && this.effectHandler.expressionName.length > 0) {
            this.vts.activateExpression(this.effectHandler.expressionName);
            if (parseInt(this.effectHandler.expressionDuration) > 0 && !this.effectHandler.expressionSync) {
                setTimeout(() => {this.vts.deactivateExpression(this.effectHandler.expressionName)}, this.effectHandler.expressionDuration);
            }
        }

        //trigger first hotkey (and setup second hotkey timer if enabled and not synced)
        if(this.effectHandler.hotkeyEnabled && this.effectHandler.hotkeyName.length > 0) {
            this.vts.triggerHotkey(this.effectHandler.hotkeyName);
            if(this.effectHandler.secondHotkeyEnabled && this.effectHandler.secondHotkeyName.length > 0 && !this.effectHandler.hotkeySync) {
                setTimeout(() => {this.vts.triggerHotkey(this.effectHandler.secondHotkeyName)},this.effectHandler.secondHotkeyDelay);
            }
        }
    }

    pause(new_duration) {
        console.log("Pausing timed effect");
        this.durationRemaining = new_duration;

        if(this.effectHandler.bonkEnabled && this.effectHandler.bonkType.length > 0) {
            clearTimeout(this.bonkTimer);
        }

        if(this.effectHandler.expressionEnabled && this.effectHandler.expressionName.length > 0 && this.effectHandler.expressionSync) {
            this.vts.deactivateExpression(this.effectHandler.expressionName);
        }
    }

    resume(new_duration) {
        console.log("Resuming timed effect");
        this.durationRemaining = new_duration;

        if(this.effectHandler.bonkEnabled && this.effectHandler.bonkType.length > 0) {
            this.throw();
        }

        if(this.effectHandler.expressionEnabled && this.effectHandler.expressionName.length > 0 && this.effectHandler.expressionSync) {
            this.vts.activateExpression(this.effectHandler.expressionName);
        }
    }

    stop() {
        console.log("Stopping timed effect");
        if(this.effectHandler.bonkEnabled && this.effectHandler.bonkType.length > 0) {
            clearTimeout(this.bonkTimer);
        }

        if(this.effectHandler.expressionEnabled && this.effectHandler.expressionName.length > 0 && this.effectHandler.expressionSync) {
            this.vts.deactivateExpression(this.effectHandler.expressionName);
        }

        if(this.effectHandler.secondHotkeyEnabled && this.effectHandler.secondHotkeyName.length > 0 && this.effectHandler.hotkeySync) {
            this.vts.triggerHotkey(this.effectHandler.secondHotkeyName);
        }
    }

    throw() {
        var customName = this.effectHandler.bonkType;
        console.log("Sending Timed Custom");
        if (this.overlaySocket != null && this.gdh.hasActiveImageCustom(customName)) {
            this.bonkBuffer = this.gdh.getCustomImagesWeightsScalesSoundsVolumes(customName,100);
            this.bonkBufferIndex += 1;
            if(this.bonkBufferIndex >= this.bonkBuffer.length) {
                this.bonkBufferIndex = 0;
            }
            const currentBonk = this.bonkBuffer[this.bonkBufferIndex];
            const customBonk = this.gdh.getCustomBonk(customName);
            var request = {
                "type": customName,
                "image": [currentBonk.location],
                "weight": [currentBonk.weight],
                "scale": [currentBonk.scale],
                "sound": [currentBonk.sound],
                "volume": [currentBonk.volume],
                "impactDecal": [currentBonk.impactDecal],
                "windupSound": [currentBonk.windupSound],
                "data": this.data,
                "game_data": this.gdh.gameData,
                "game_data_path": this.game_data_path
            }
            this.overlaySocket.send(JSON.stringify(request));
            var bonkDelay = this.data.barrageFrequency * 1000;
            if(customBonk.barrageFrequencyOverride == true) {
                bonkDelay = customBonk.barrageFrequency * 1000;
            }
            bonkDelay += Math.floor((Math.random() * bonkDelay * 1.5) - (bonkDelay * 0.75));
            console.log(`Duration Remaining: ${this.durationRemaining}, Bonk Delay: ${bonkDelay}`);
            this.durationRemaining -= bonkDelay;
            if(this.durationRemaining > 0) {
                this.bonkTimer = setTimeout(() => {this.throw();},bonkDelay);
            }
        }
    }
}