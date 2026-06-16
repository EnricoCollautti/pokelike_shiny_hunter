# Pokelike Shiny Hunter

Local Tampermonkey userscript for automating a Kanto Battle Tower shiny hunt on:

```text
https://pokelike.xyz/*
```

The script uses normal browser UI interaction only: visible DOM checks, clicks, key events, waits, and page reload as a last fallback. It does not modify Pokelike source code, RNG, saved game data, Pokedex data, achievements, Hall of Fame data, or Pokelike localStorage keys.

Use only in your own browser and respect the game creator's rules.

## Install

1. Install the Tampermonkey browser extension.
2. Open the Tampermonkey dashboard.
3. Click `Create a new script`.
4. Replace the default contents with:
   `pokelike-kanto-battle-tower-shiny-charmander-hunter.user.js`
5. Save the script.
6. Open `https://pokelike.xyz/`.

You should see a floating panel named `Shiny Hunter - v...`.

## Usage

1. Open Pokelike.
2. Click `Start` in the bot panel.
3. Choose the target Pokemon and starter in the bot panel.
4. The bot enters Battle Tower, selects Kanto, selects your starter, opens the first pokeball catch node, and checks the Pokemon choices.
5. If a shiny version of your target appears, the bot stops and alerts you.
6. If the shiny target does not appear, the bot resets/rerolls and repeats.

Defaults:

```text
Target: Charmander
Starter: Magnemite
```

The small log shows only:

```text
No target
<Target>! Too bad it's not shiny! :(
A Shiny! Too bad it's not <Target> :(
```

## Controls

- `Start`: starts the hunt loop.
- `Pause`: pauses or resumes the bot.
- `Stop`: stops the bot.
- `Escape`: emergency stop.
- `Insert`: hide or show the overlay.
- `Copy log`: copies a debug log if something breaks.

## Settings

- `Target`: Pokemon to shiny hunt, for example `Charmander`.
- `Starter`: Battle Tower starter to select, for example `Magnemite`.
- `Min delay` / `Max delay`: random wait between major actions, in milliseconds.
- `Stop after N attempts`: stop after this many checks; `0` means unlimited.
- `Catch shiny target automatically`: off by default, so you can continue manually after detection.
- `Stop on any shiny`: stop when any shiny appears, even if it is not your target.
- `Dry run mode`: logs what the bot would do without clicking, pressing keys, resetting, or reloading.
- `Auto resume after reload`: starts automatically when the Pokelike page loads.

The target and starter are saved in the browser under the script's own `pkCharmanderHunter_*` localStorage keys. If you prefer editing code, the default values live near the top of the userscript in `CONFIG.targetPokemon` and `CONFIG.starterPokemon`.

## Safety Notes

This is automation. Even though it is local-only and does not modify game internals, it may still violate the game creator's rules. Use it only if you are comfortable with that risk.

## Debugging

If the bot gets stuck:

1. Click `Copy log` in the overlay.
2. Paste the copied text into an issue or a local file.
3. Include what screen the game was on when it stopped.

Debug helpers are also available in the browser console:

```js
window.pkHunterDebug.state()
window.pkHunterDebug.cards()
window.pkHunterDebug.catchNodes()
window.pkHunterDebug.mapElements()
window.pkHunterDebug.copyLog()
window.pkHunterDebug.stop()
```
