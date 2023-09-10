# TuberYeets: your local automation agent [EXPERIMENTAL]

Create more immersive viewer experiences by turning events in one app/service into actions in others.

Connecting Crowd Control 2, VTube Studio, and more.

## Contents

- [TuberYeets?!](#tuberyeets)
  * [What is TuberYeets?](#what-is-tuberyeets)
    + [Disclaimer](#disclaimer)
  * [What isn't TuberYeets?](#what-isnt-tuberyeets)
  * [Who is it for?](#who-is-it-for)
- [Supported Connections](#supported-connections)
  * [Crowd Control](#crowd-control)
  * [VTube Studio](#vtube-studio)
  * [Overlay](#overlay)
    + [HTTP POST Request](#http-post-request)
- [Getting Started](#getting-started)
  * [Installation](#installation)
  * [Configuration](#configuration)
  * [Overlay Setup and Calibration](#overlay-setup-and-calibration)
- [Adding Assets and Creating Triggers](#adding-assets-and-creating-triggers)
- [Installing/Sharing Trigger Profiles](#installingsharing-trigger-profiles)
- [Known Issues](#known-issues)
- [Planned Features](#planned-features)
- [Community](#community)
- [Contributing](#contributing)
  * [Development setup](#development-setup)
    + [Install Dependencies](#install-dependencies)
    + [Compile and hot-reload for development](#compile-and-hot-reload-for-development)
    + [Compile and minify and pack for production](#compile-and-minify-and-pack-for-production)

<a name="tuberyeets"></a>
## TuberYeets?!

<a name="what-is-tuberyeets"></a>
### What is TuberYeets?

Much like the delivery service with the rhyming name, TuberYeets works to deliver stuff (information) from one place to another.
This allows you to respond to an event in one app (like Crowd Control) with some sort of action somewhere else (such as VTube Studio).
_Unlike_ the aforementioned delivery service, TuberYeets is more about throwing stuff at VTubers.

TuberYeets is an **application** that runs entirely on your own machine.

<a name="disclaimer"></a>
#### Disclaimer

Along with the above, TuberYeets is also **experimental software** in an early state of development.  It will have bugs, it might break sometimes, and it is possible that core features or data structures could change, rendering effects you've previously set up unusable!

Wherever possible I'll aim to create some tool or process to convert existing Trigger Profiles to conform to any data changes to avoid issues

<a name="what-isnt-tuberyeets"></a>
### What isn't TuberYeets?

TuberYeets is not a SaaS product, and it doesn't directly offer (or rely on) "cloud"-type features that use an offsite server to perform its main functionality. 

That means the project can be offered completely free of charge (or recurring costs), and you never have to worry it might stop working because someone decided to shut down a server.  That also means it doesn't collect analytics or usage data, and doesn't "phone home".

TuberYeets does integrate with SaaS services (such as Crowd Control) to allow it to connect those servives to other things, but TuberYeets itself is just a program, **is not a service**

<a name="who-is-it-for"></a>
### Who is it for?

If you're a VTuber using VTube Studio, you stream a lot of Crowd Control, and you're looking for a way to add some flare to your performances, then this is for you!

TuberYeets also lets you set up a distinct Trigger Profile for each Crowd Control-supported game that you play, giving you the freedom to build some really involved experiences to dazzle your audience.

<a name="supported-connections"></a>
## Supported Connections

At time or writing, this version on TuberYeets supports connections to these apps and services:

<a name="crowd-control"></a>
### Crowd Control

The Crowd Control integration is at the heart of TuberYeets, and was the main basis for the project's creation.  
TuberYeets can fire Triggers in response to Crowd Controls signature in-game effects, and the main data structure of TuberYeets is geared towards providing a distinct "Profile" of Assets and Triggers for each supported game

<a name="vtube-studio"></a>
### VTube Studio

TuberYeets also closely integrates with VTube Studio so that you can create more immersive experiences.  TuberYeets can
- Toggle Expressions
- Activate Hotkeys
- track the model's current position and other core details
- apply physics when impacted by a thrown item

<a name="overlay"></a>
### Overlay

TuberYeets ships with a built-in Overlay that enabled some of the core functionality: Throwing stuff!  This gets placed as a Browser Source, directly on top of your VTS capture.
the TuberYeets app lets you add and manage Items, Sounds, and Item Groups.  Triggers can be configured to that the Overlay can respond to events in a few different ways:
- Throw an **Item**
- Throw a **Group of Items**
- Start or stop throwing a constant **Stream of Items** (great for Crowd Control time effects!)
- Play a **Sound**

<a name="http-post-request"></a>
#### HTTP POST Request

the Overlay can also respond to a trigger by submitting an HTTP POST request to your chosen URL, either with a custom JSON payload or one automatically generated to include all of the important event and trigger details.

Among other things, this can be used to connect TuberYeets to **Mix It Up** through their webhook service and activate actions over there based on triggers over here.

<a name="getting-started"></a>
## Getting Started

<a name="installation"></a>
### Installation

- **IMPORTANT** If you had the legacy version of TuberYeets installed previously (the version that worked with Crowd Control 1), it's imporant that you remove the old TuberYeets data directory (usually located at a path like `C:\Users\YourNameHere\AppData\Roaming\tuberyeets`)
- Download the latest release, and run the installer
- To get up and running very quickly, you can also download the pre-configures LttP Trigger Profile listed alongside the latest release

<a name="configuration"></a>
### Configuration

Once you've installed and run the application, you'll be presented with the settings page!
From here you'll need to do a few things to get yourself set up:
- **Enable the Crowd Control connection:** Authorize TuberYeets with your Crowd Control account
  - This allows TuberYeets to detect in-game effects and active game session details
- **Enable the VTube Studio connection:** you'll need to provide the port that VTube Studio API is active on, and accept the access request from inside VTS.
  - This lets Tuberyeets access model information, expression/hotkey lists, and move/control some Live2D parameters
  - Be sure the VTS API is turned on
- **Enable the Overlay connection:** The default settings are usually fine, you should just be able to enable this one
  - If you're having trouble connecting to the TuberYeets overlay, try changing __Browser Source Port__, as the default port may be used by some other application

<a name="overlay-setup-and-calibration"></a>
### Overlay Setup and Calibration

See the [Overlay Setup and Calibration Guide](https://github.com/jayo-exe/tuberyeets/wiki/Overlay-Setup-and-Calibration-Guide) for detailed instructions on setting up the Browser Source and setting the model targeting.

<a name="adding-assets-and-creating-triggers"></a>
## Adding Assets and Creating Triggers

See these guides for more information on the basics of creating experiences with TuberYeets:
- [Overlay Assets](https://github.com/jayo-exe/tuberyeets/wiki/Overlay-Assets)
- [Triggers, Scripts and Commands](https://github.com/jayo-exe/tuberyeets/wiki/Triggers,-Scripts-and-Commands)

<a name="installingsharing-trigger-profiles"></a>
## Installing/Sharing Trigger Profiles

While TuberYeets doesn't have any official/structured mechanism for sharing assets and triggers (yet), you can ZIP up and share your current configuration for a particular game!

You can "install" a pack shared by someone else (such as the LttP Example Pack) like this:

- Open TuberYeets, and select a game
- click the folder icon next to the Game Select dropdown. This will open the folder that contains your assets, triggers and data for the selected game
  - You may want to consider __backing up your current triggers and assets to their own ZIP file__ at this time
- Copy the contents of the ZIP File into this folder.  If prompted to overwrite and files, say YES
  - __This will remove any already-configured effects for this game__.  Do this only for games where you haven't set up any custom effects of your own, or after you've backup up your own effects
- Restart TuberYeets (or change to another game and then change back) and TuberYeets will load the new assets and triggers!
  - Certain VTS-related trigger actions (Hotkeys and Expressions) expect the model to have an expression or hotkey with the name configured in that action.
    You may need to add these items to your VTS Model Configuration or update the trigger actions to use one of your existing expressions/hotkeys in order for them to work properly

__Note:__ As always, exercise caution when accepting files over the internet! Only download and open files from sources that you trust.



<a name="known-issues"></a>
## Known Issues
- Items in the "Select Game" dropdown do not list their platform (NES, SNES, PC, etc).  This can be confusing in some situations where games are listed under multiple platforms (i.e. Terraria, Minecraft)

<a name="planned-features"></a>
## Planned Features

Listed in no particular order:

- Integrations with additional common VTubing platforms, to bring TuberYeets to more friends!
- Improved Crowd Control integration
  - additional inputs based on more events (Bidwars, coin purchases/spends)
- Improved VTS Integration
  - additional outputs (loading/moving models, manipulating item scenes, etc)
  - support for inputs based on events in VTS
  - Ability to map data like ArtMesh Groups and alias Expressions/Hotkeys to improve shared assets
- Additional integrations
  - **OBS**, for various inputs and outputs related to sources, scenes, and general state
  - **Streamer.bot** (via HTTP API), supporting an output to activate an action in Streamer.bot
  - **MIDI** input to support triggers being fired from your MIDI Controller
  - **Twitch Integrated Throwing System (T.I.T.S.)**, allowing items to be thrown on this popular overlay
- Manual Overlay Calibration option, so non-VTS users can take full advantage of the TuberYeets overlay
- "Global Assets" system, to support common Assets and Triggers that are available regardless of the loaded profile
- More intuitive TuberYeets Trigger Pack sharing, importing, and exporting
- Additional Overlay animation types for on-screen items (Rather than just throwing them towards or away from the model)
- Integration with Twitch to allow triggers based on cheers or Channel Point redemptions
- Serving the overlay and all related static assets over a built-in HTTP server to simplify overlay stuff, as well as provide an entry point for...
- TuberYeets HTTP API, so third-party apps can activate TuberYeets Triggers in response to their own events
- TuberYeets PubSub Server, so third-party apps can activate their own triggers in response to TuberYeets Events

<a name="community"></a>
## Community

Join the small-but-growing TuberYeets community!  You can find us on Discord: https://discord.gg/jCbKeWDrYt

Get help setting up, share your TuberYeets clips and streams, suggest improvements or features, find collab opportunities, or just come hang out!

I'm a _very_ infrequent/casual VTuber, so I'd love to hear from **all of you** about the tools you use and the way you work, so that TuberYeets can become a more effective tool for everyone!

<a name="contributing"></a>
## Contributing
- If you'd like to contribute to the development of TuberYeets, I'd love your help! Join the TuberYeets discord at https://discord.gg/jCbKeWDrYt if you'd like to collaborate and share your ideas
- If you're looking to develop more independently (or make a better, cooler version of this application), You're free to do so!  I've released this project under the MIT license so you aren't very restricted in how you use this code.

<a name="development-setup"></a>
### Development setup

<a name="install-dependencies"></a>
#### Install Dependencies
```
npm install
```

<a name="compile-and-hot-reload-for-development"></a>
#### Compile and hot-reload for development
```
npm run electron:serve
```

<a name="compile-and-minify-and-pack-for-production"></a>
#### Compile and minify and pack for production
```
npm run electron:build
```