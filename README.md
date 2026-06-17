# Pokelike Shiny Hunter

Local Tampermonkey userscript for automating a Battle Tower shiny hunt on:

```text
https://pokelike.xyz/*
```

The script uses normal browser UI interaction only: visible DOM checks, clicks, key events, waits, and page reload as a last fallback. It does not modify Pokelike source code, RNG, saved game data, Pokedex data, achievements, Hall of Fame data, or Pokelike localStorage keys.

Use only in your own browser and respect the game creator's rules.

## Install

1. Install the Tampermonkey browser extension.
2. If you use Chrome or Edge, follow Tampermonkey's `Permission to execute userscripts` instructions:
   https://www.tampermonkey.net/faq.php?q=Q209#Q209
3. Open the Tampermonkey dashboard.
4. Click `Create a new script`.
5. Replace the default contents with:
   `pokelike-shiny-hunter.user.js`
6. Save the script.
7. Open `https://pokelike.xyz/`.

You should see a floating panel named `Shiny Hunter - v...`.

## Usage

1. Open Pokelike.
2. Open the `Hunt` tab and choose the Battle Tower region, target Pokemon, and starter.
3. Click `Start` in the bot panel.
4. The bot enters Battle Tower, selects your region, selects your starter, opens the first pokeball catch node, and checks the Pokemon choices.
5. If enabled, the bot uses each visible per-Pokemon reroll button once, then checks the rerolled choices too.
6. If a shiny version of your target appears, the bot stops and alerts you with the attempt count.
7. If the shiny target does not appear, the bot resets/rerolls the run and repeats.

Defaults:

```text
Target: Charmander
Starter: Magnemite
Region: Kanto
Use one reroll per Pokemon slot: on
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
- `Save` in the `Hunt` tab: applies the selected region, target, and starter, including while the bot is running.
- `Escape`: emergency stop.
- `Hide`: collapses the overlay to a tiny movable tab shifted left from the game menu.
- `bot` / `show`: restores the overlay after hiding it.
- `Insert`: hide or show the overlay.
- `Copy log`: copies a debug log if something breaks.

You can drag the full panel by its header and resize it from the bottom-right corner. Each tab remembers its own panel height, so the larger `Hunt` tab can stay taller while compact tabs stay shorter. The hidden `bot` / `show` tab can be restored by clicking it, dragged by the small blue handle, and resized from its bottom-right corner. Positions and sizes are saved in the browser under the script's own keys.

The panel is split into tabs:

- `Status`: run controls, current state, current hunt, and the small log.
- `Hunt`: region, target, and starter.
- `Settings`: delays, rerolls, stop conditions, and automation toggles.
- `Debug`: last error and copy-log tools.

## Settings

- `Region`: Battle Tower region to run: `Kanto`, `Johto`, `Hoenn`, `Sinnoh`, or `Unova`.
- `Target`: Pokemon to shiny hunt, for example `Charmander`. Start typing to filter Pokemon introduced in the selected region. Use arrow keys and `Enter` to select from the list.
- `Starter`: Battle Tower starter to select, for example `Magnemite`. Start typing to filter Pokemon introduced in the selected region. Use arrow keys and `Enter` to select from the list.
- `Min delay` / `Max delay`: random wait between major actions, in milliseconds.
- `Stop after N attempts`: stop after this many checks; `0` means unlimited.
- `Catch shiny target automatically`: off by default, so you can continue manually after detection.
- `Use one reroll per Pokemon slot`: on by default; checks the initial three Pokemon, clicks each visible slot reroll once, then checks the rerolled choices.
- `Stop on any shiny`: stop when any shiny appears, even if it is not your target.
- `Dry run mode`: logs what the bot would do without clicking, pressing keys, resetting, or reloading.
- `Auto resume after reload`: starts automatically when the Pokelike page loads.

The target and starter picker shows a small sprite thumbnail, the Pokemon name, and type badges. Sprite thumbnails are loaded only for visible picker suggestions so they should not affect the hunt loop.

The region, target, starter, and other settings are saved in the browser under the script's own `pkCharmanderHunter_*` localStorage keys. If you prefer editing code, the default values live near the top of the userscript in `CONFIG`.

When you change the target Pokemon, the saved attempt counter resets to `0`. When a shiny target is found, the alert says how many attempts it took. The saved attempt counter is then reset to `0` for the next hunt.

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
window.pkHunterDebug.rerolls()
window.pkHunterDebug.mapElements()
window.pkHunterDebug.copyLog()
window.pkHunterDebug.stop()
```
