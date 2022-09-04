# TuberYeets

## User Setup
- Download the latest release, and run the installer

### Configuration
Once you've installed and run the application for the first time: 
- go to the "Settings" page, scroll down to "Advanced"
- Update the __Crowd Control Channel__ to your Twitch username
- Update the __VTube Studio Port__ to match your existing setup
- If you're having trouble connecting to the TuberYeets overlay, try changing __Browser Source Port__, as the default port may be used by some other application

### Installing Effects Packs
- Open TuberYeets, select a game, and navigate to the __Library__ section
- click the __Open Gamer Folder__ button.  This will open the folder that contains your effect files for the selected game
- Copy the contents of an Effects Pack ZIP File into this folder.  If prompted to overwrite and files, say YES
- __Note:__  This will remove any already-configured effects for this game.  Do this only for games where you haven't set up any custom effects of your own.

## Development setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run electron:serve
```

### Compiles and minifies for production
```
npm run electron:build
```

## Known Issues:
- Hotkeys trigered by effects can sync with the "Start" and "Stop" on times effects, but not the "Pause" And "Resume".  This is to avoid an issue with the VTS API where certain hotkeys will fail to engage if they are triggered too soon after another hotkey.
- Items in the "Select Game" dropdown do not list their platform (NES, SNES, PC, etc).  This can be confusing, especially because there are two "Terraria" entries
- Effects that use the same VTS hotkey can cause the hotkey to pre-maturely end (when the first effect ends, it activates the second hotkey to return things to "normal", even if there are other effects still happeneing that use the same hotkey.

## Possible upcoming features:
- Update system, so users won't need to uninstall and re-install the application when there is a new version
- More direct integration with the VTS API, to directly control things like changing the currently-loaded model, handling movement, scaling, placemoent of Workshop items
- Support for Bidwar-driven effects
- Support for displaying effects when Crowd Cowntrol Coins are purchased
- Support for custom Crowd Control Game Paks
- In-app deletion of assets (right now TuberYeets does not delete any images/sounds from the relevant folder.  For this first release I wasn't comfortable with deleting arbitrary files listing in the JSON file, this feels like a security issue.
- Hotkey concurrency to allow VTS hotkeys to track with pause/resume, and more gracefully handle multiple effects using the same hotkeys.
- More intuitive TuberYeets Effeck Pack sharing, importing, and exporting
- Additional animation types for on-screen items (Rather than just throwing them towards or away from the model)
- A distinct TuberYeets icon

## Contributing
- If you'd like to contribute to the development of TuberYeet, I'd love your help! Join the JayoSPACE discord at [discord link] if you'd like to collaborate and share your ideas
- If you're looking to develop more independently (or make a better, cooler version of this application), You're free to do so!  I've released this project under the MIT license so you aren't very restricted in how you use this code.