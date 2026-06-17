// ==UserScript==
// @name         Pokelike Shiny Hunter
// @namespace    local.pokelike.charmander.hunter
// @version      2.0.2
// @author       enricocollautti
// @description  Local UI automation helper for shiny hunting in Pokelike Battle Tower
// @homepageURL  https://github.com/EnricoCollautti/pokelike_shiny_hunter
// @supportURL   https://github.com/EnricoCollautti/pokelike_shiny_hunter/issues
// @updateURL    https://raw.githubusercontent.com/EnricoCollautti/pokelike_shiny_hunter/main/pokelike-shiny-hunter.user.js
// @downloadURL  https://raw.githubusercontent.com/EnricoCollautti/pokelike_shiny_hunter/main/pokelike-shiny-hunter.user.js
// @match        https://pokelike.xyz/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * Use only in your own browser and respect the game creator's rules.
 *
 * This script is a local-only UI automation helper. It does not modify
 * Pokelike source code, bundled scripts, RNG, saved game data, Pokedex data,
 * achievements, Hall of Fame data, or any Pokelike localStorage keys.
 */

(() => {
  "use strict";

  // ---------------------------------------------------------------------------
  // Constants and persisted settings
  // ---------------------------------------------------------------------------

  const DISCLAIMER = "Use only in your own browser and respect the game creator's rules.";
  const STORAGE_PREFIX = "pkCharmanderHunter_";
  const OVERLAY_ID = "pkCharmanderHunterOverlay";
  const SCRIPT_VERSION = "2.0.2";
  const UPDATE_URL = "https://raw.githubusercontent.com/EnricoCollautti/pokelike_shiny_hunter/main/pokelike-shiny-hunter.user.js";

  const DEFAULT_PANEL_WIDTH = 360;
  const MIN_PANEL_WIDTH = 320;
  const MIN_PANEL_HEIGHT = 260;
  const PANEL_LAYOUT_VERSION = "4";
  const PANEL_DEFAULT_HEIGHTS = {
    status: 640,
    hunt: 500,
    settings: 430,
    debug: 300
  };
  const DEFAULT_PANEL_TOP = 12;
  const DEFAULT_PANEL_RIGHT = 12;
  const DEFAULT_RESTORE_RIGHT = 56;
  const DEFAULT_RESTORE_WIDTH = 54;
  const DEFAULT_RESTORE_HEIGHT = 42;

  const STATES = {
    IDLE: "IDLE",
    ENTER_MAIN_MENU: "ENTER_MAIN_MENU",
    ENTER_BATTLE_TOWER: "ENTER_BATTLE_TOWER",
    SELECT_REGION: "SELECT_REGION",
    SELECT_STARTER: "SELECT_STARTER",
    OPEN_FIRST_CATCH_NODE: "OPEN_FIRST_CATCH_NODE",
    WAIT_FOR_POKEMON_CHOICES: "WAIT_FOR_POKEMON_CHOICES",
    CHECK_FOR_SHINY_TARGET: "CHECK_FOR_SHINY_TARGET",
    CATCH_TARGET: "CATCH_TARGET",
    RESET_RUN: "RESET_RUN",
    FOUND: "FOUND",
    ERROR: "ERROR",
    STOPPED: "STOPPED"
  };

  const CONFIG = {
    region: "kanto",
    targetPokemon: "Charmander",
    starterPokemon: "Magnemite",
    minDelayMs: 300,
    maxDelayMs: 800,
    stopAfterAttempts: 0,
    maxConsecutiveErrors: 5,
    autoCatch: false,
    useChoiceRerolls: true,
    stopOnAnyShiny: false,
    dryRun: false,
    autoResume: false
  };

  const REGION_DEFINITIONS = [
    {
      key: "kanto",
      label: "Kanto",
      stageName: "Kanto",
      pokemon: [
        [1, "Bulbasaur", "Grass", "Poison"],
        [2, "Ivysaur", "Grass", "Poison"],
        [3, "Venusaur", "Grass", "Poison"],
        [4, "Charmander", "Fire"],
        [5, "Charmeleon", "Fire"],
        [6, "Charizard", "Fire", "Flying"],
        [7, "Squirtle", "Water"],
        [8, "Wartortle", "Water"],
        [9, "Blastoise", "Water"],
        [10, "Caterpie", "Bug"],
        [11, "Metapod", "Bug"],
        [12, "Butterfree", "Bug", "Flying"],
        [13, "Weedle", "Bug", "Poison"],
        [14, "Kakuna", "Bug", "Poison"],
        [15, "Beedrill", "Bug", "Poison"],
        [16, "Pidgey", "Normal", "Flying"],
        [17, "Pidgeotto", "Normal", "Flying"],
        [18, "Pidgeot", "Normal", "Flying"],
        [19, "Rattata", "Normal"],
        [20, "Raticate", "Normal"],
        [21, "Spearow", "Normal", "Flying"],
        [22, "Fearow", "Normal", "Flying"],
        [23, "Ekans", "Poison"],
        [24, "Arbok", "Poison"],
        [25, "Pikachu", "Electric"],
        [26, "Raichu", "Electric"],
        [27, "Sandshrew", "Ground"],
        [28, "Sandslash", "Ground"],
        [29, "Nidoran F", "Poison"],
        [30, "Nidorina", "Poison"],
        [31, "Nidoqueen", "Poison", "Ground"],
        [32, "Nidoran M", "Poison"],
        [33, "Nidorino", "Poison"],
        [34, "Nidoking", "Poison", "Ground"],
        [35, "Clefairy", "Fairy"],
        [36, "Clefable", "Fairy"],
        [37, "Vulpix", "Fire"],
        [38, "Ninetales", "Fire"],
        [39, "Jigglypuff", "Normal", "Fairy"],
        [40, "Wigglytuff", "Normal", "Fairy"],
        [41, "Zubat", "Poison", "Flying"],
        [42, "Golbat", "Poison", "Flying"],
        [43, "Oddish", "Grass", "Poison"],
        [44, "Gloom", "Grass", "Poison"],
        [45, "Vileplume", "Grass", "Poison"],
        [46, "Paras", "Bug", "Grass"],
        [47, "Parasect", "Bug", "Grass"],
        [48, "Venonat", "Bug", "Poison"],
        [49, "Venomoth", "Bug", "Poison"],
        [50, "Diglett", "Ground"],
        [51, "Dugtrio", "Ground"],
        [52, "Meowth", "Normal"],
        [53, "Persian", "Normal"],
        [54, "Psyduck", "Water"],
        [55, "Golduck", "Water"],
        [56, "Mankey", "Fighting"],
        [57, "Primeape", "Fighting"],
        [58, "Growlithe", "Fire"],
        [59, "Arcanine", "Fire"],
        [60, "Poliwag", "Water"],
        [61, "Poliwhirl", "Water"],
        [62, "Poliwrath", "Water", "Fighting"],
        [63, "Abra", "Psychic"],
        [64, "Kadabra", "Psychic"],
        [65, "Alakazam", "Psychic"],
        [66, "Machop", "Fighting"],
        [67, "Machoke", "Fighting"],
        [68, "Machamp", "Fighting"],
        [69, "Bellsprout", "Grass", "Poison"],
        [70, "Weepinbell", "Grass", "Poison"],
        [71, "Victreebel", "Grass", "Poison"],
        [72, "Tentacool", "Water", "Poison"],
        [73, "Tentacruel", "Water", "Poison"],
        [74, "Geodude", "Rock", "Ground"],
        [75, "Graveler", "Rock", "Ground"],
        [76, "Golem", "Rock", "Ground"],
        [77, "Ponyta", "Fire"],
        [78, "Rapidash", "Fire"],
        [79, "Slowpoke", "Water", "Psychic"],
        [80, "Slowbro", "Water", "Psychic"],
        [81, "Magnemite", "Electric", "Steel"],
        [82, "Magneton", "Electric", "Steel"],
        [83, "Farfetch\u0027d", "Normal", "Flying"],
        [84, "Doduo", "Normal", "Flying"],
        [85, "Dodrio", "Normal", "Flying"],
        [86, "Seel", "Water"],
        [87, "Dewgong", "Water", "Ice"],
        [88, "Grimer", "Poison"],
        [89, "Muk", "Poison"],
        [90, "Shellder", "Water"],
        [91, "Cloyster", "Water", "Ice"],
        [92, "Gastly", "Ghost", "Poison"],
        [93, "Haunter", "Ghost", "Poison"],
        [94, "Gengar", "Ghost", "Poison"],
        [95, "Onix", "Rock", "Ground"],
        [96, "Drowzee", "Psychic"],
        [97, "Hypno", "Psychic"],
        [98, "Krabby", "Water"],
        [99, "Kingler", "Water"],
        [100, "Voltorb", "Electric"],
        [101, "Electrode", "Electric"],
        [102, "Exeggcute", "Grass", "Psychic"],
        [103, "Exeggutor", "Grass", "Psychic"],
        [104, "Cubone", "Ground"],
        [105, "Marowak", "Ground"],
        [106, "Hitmonlee", "Fighting"],
        [107, "Hitmonchan", "Fighting"],
        [108, "Lickitung", "Normal"],
        [109, "Koffing", "Poison"],
        [110, "Weezing", "Poison"],
        [111, "Rhyhorn", "Ground", "Rock"],
        [112, "Rhydon", "Ground", "Rock"],
        [113, "Chansey", "Normal"],
        [114, "Tangela", "Grass"],
        [115, "Kangaskhan", "Normal"],
        [116, "Horsea", "Water"],
        [117, "Seadra", "Water"],
        [118, "Goldeen", "Water"],
        [119, "Seaking", "Water"],
        [120, "Staryu", "Water"],
        [121, "Starmie", "Water", "Psychic"],
        [122, "Mr. Mime", "Psychic", "Fairy"],
        [123, "Scyther", "Bug", "Flying"],
        [124, "Jynx", "Ice", "Psychic"],
        [125, "Electabuzz", "Electric"],
        [126, "Magmar", "Fire"],
        [127, "Pinsir", "Bug"],
        [128, "Tauros", "Normal"],
        [129, "Magikarp", "Water"],
        [130, "Gyarados", "Water", "Flying"],
        [131, "Lapras", "Water", "Ice"],
        [132, "Ditto", "Normal"],
        [133, "Eevee", "Normal"],
        [134, "Vaporeon", "Water"],
        [135, "Jolteon", "Electric"],
        [136, "Flareon", "Fire"],
        [137, "Porygon", "Normal"],
        [138, "Omanyte", "Rock", "Water"],
        [139, "Omastar", "Rock", "Water"],
        [140, "Kabuto", "Rock", "Water"],
        [141, "Kabutops", "Rock", "Water"],
        [142, "Aerodactyl", "Rock", "Flying"],
        [143, "Snorlax", "Normal"],
        [144, "Articuno", "Ice", "Flying"],
        [145, "Zapdos", "Electric", "Flying"],
        [146, "Moltres", "Fire", "Flying"],
        [147, "Dratini", "Dragon"],
        [148, "Dragonair", "Dragon"],
        [149, "Dragonite", "Dragon", "Flying"],
        [150, "Mewtwo", "Psychic"],
        [151, "Mew", "Psychic"]
      ]
    },
    {
      key: "johto",
      label: "Johto",
      stageName: "Johto",
      pokemon: [
        [152, "Chikorita", "Grass"],
        [153, "Bayleef", "Grass"],
        [154, "Meganium", "Grass"],
        [155, "Cyndaquil", "Fire"],
        [156, "Quilava", "Fire"],
        [157, "Typhlosion", "Fire"],
        [158, "Totodile", "Water"],
        [159, "Croconaw", "Water"],
        [160, "Feraligatr", "Water"],
        [161, "Sentret", "Normal"],
        [162, "Furret", "Normal"],
        [163, "Hoothoot", "Normal", "Flying"],
        [164, "Noctowl", "Normal", "Flying"],
        [165, "Ledyba", "Bug", "Flying"],
        [166, "Ledian", "Bug", "Flying"],
        [167, "Spinarak", "Bug", "Poison"],
        [168, "Ariados", "Bug", "Poison"],
        [169, "Crobat", "Poison", "Flying"],
        [170, "Chinchou", "Water", "Electric"],
        [171, "Lanturn", "Water", "Electric"],
        [172, "Pichu", "Electric"],
        [173, "Cleffa", "Fairy"],
        [174, "Igglybuff", "Normal", "Fairy"],
        [175, "Togepi", "Fairy"],
        [176, "Togetic", "Fairy", "Flying"],
        [177, "Natu", "Psychic", "Flying"],
        [178, "Xatu", "Psychic", "Flying"],
        [179, "Mareep", "Electric"],
        [180, "Flaaffy", "Electric"],
        [181, "Ampharos", "Electric"],
        [182, "Bellossom", "Grass"],
        [183, "Marill", "Water", "Fairy"],
        [184, "Azumarill", "Water", "Fairy"],
        [185, "Sudowoodo", "Rock"],
        [186, "Politoed", "Water"],
        [187, "Hoppip", "Grass", "Flying"],
        [188, "Skiploom", "Grass", "Flying"],
        [189, "Jumpluff", "Grass", "Flying"],
        [190, "Aipom", "Normal"],
        [191, "Sunkern", "Grass"],
        [192, "Sunflora", "Grass"],
        [193, "Yanma", "Bug", "Flying"],
        [194, "Wooper", "Water", "Ground"],
        [195, "Quagsire", "Water", "Ground"],
        [196, "Espeon", "Psychic"],
        [197, "Umbreon", "Dark"],
        [198, "Murkrow", "Dark", "Flying"],
        [199, "Slowking", "Water", "Psychic"],
        [200, "Misdreavus", "Ghost"],
        [201, "Unown", "Psychic"],
        [202, "Wobbuffet", "Psychic"],
        [203, "Girafarig", "Normal", "Psychic"],
        [204, "Pineco", "Bug"],
        [205, "Forretress", "Bug", "Steel"],
        [206, "Dunsparce", "Normal"],
        [207, "Gligar", "Ground", "Flying"],
        [208, "Steelix", "Steel", "Ground"],
        [209, "Snubbull", "Fairy"],
        [210, "Granbull", "Fairy"],
        [211, "Qwilfish", "Water", "Poison"],
        [212, "Scizor", "Bug", "Steel"],
        [213, "Shuckle", "Bug", "Rock"],
        [214, "Heracross", "Bug", "Fighting"],
        [215, "Sneasel", "Dark", "Ice"],
        [216, "Teddiursa", "Normal"],
        [217, "Ursaring", "Normal"],
        [218, "Slugma", "Fire"],
        [219, "Magcargo", "Fire", "Rock"],
        [220, "Swinub", "Ice", "Ground"],
        [221, "Piloswine", "Ice", "Ground"],
        [222, "Corsola", "Water", "Rock"],
        [223, "Remoraid", "Water"],
        [224, "Octillery", "Water"],
        [225, "Delibird", "Ice", "Flying"],
        [226, "Mantine", "Water", "Flying"],
        [227, "Skarmory", "Steel", "Flying"],
        [228, "Houndour", "Dark", "Fire"],
        [229, "Houndoom", "Dark", "Fire"],
        [230, "Kingdra", "Water", "Dragon"],
        [231, "Phanpy", "Ground"],
        [232, "Donphan", "Ground"],
        [233, "Porygon2", "Normal"],
        [234, "Stantler", "Normal"],
        [235, "Smeargle", "Normal"],
        [236, "Tyrogue", "Fighting"],
        [237, "Hitmontop", "Fighting"],
        [238, "Smoochum", "Ice", "Psychic"],
        [239, "Elekid", "Electric"],
        [240, "Magby", "Fire"],
        [241, "Miltank", "Normal"],
        [242, "Blissey", "Normal"],
        [243, "Raikou", "Electric"],
        [244, "Entei", "Fire"],
        [245, "Suicune", "Water"],
        [246, "Larvitar", "Rock", "Ground"],
        [247, "Pupitar", "Rock", "Ground"],
        [248, "Tyranitar", "Rock", "Dark"],
        [249, "Lugia", "Psychic", "Flying"],
        [250, "Ho-Oh", "Fire", "Flying"],
        [251, "Celebi", "Psychic", "Grass"]
      ]
    },
    {
      key: "hoenn",
      label: "Hoenn",
      stageName: "Hoenn",
      pokemon: [
        [252, "Treecko", "Grass"],
        [253, "Grovyle", "Grass"],
        [254, "Sceptile", "Grass"],
        [255, "Torchic", "Fire"],
        [256, "Combusken", "Fire", "Fighting"],
        [257, "Blaziken", "Fire", "Fighting"],
        [258, "Mudkip", "Water"],
        [259, "Marshtomp", "Water", "Ground"],
        [260, "Swampert", "Water", "Ground"],
        [261, "Poochyena", "Dark"],
        [262, "Mightyena", "Dark"],
        [263, "Zigzagoon", "Normal"],
        [264, "Linoone", "Normal"],
        [265, "Wurmple", "Bug"],
        [266, "Silcoon", "Bug"],
        [267, "Beautifly", "Bug", "Flying"],
        [268, "Cascoon", "Bug"],
        [269, "Dustox", "Bug", "Poison"],
        [270, "Lotad", "Water", "Grass"],
        [271, "Lombre", "Water", "Grass"],
        [272, "Ludicolo", "Water", "Grass"],
        [273, "Seedot", "Grass"],
        [274, "Nuzleaf", "Grass", "Dark"],
        [275, "Shiftry", "Grass", "Dark"],
        [276, "Taillow", "Normal", "Flying"],
        [277, "Swellow", "Normal", "Flying"],
        [278, "Wingull", "Water", "Flying"],
        [279, "Pelipper", "Water", "Flying"],
        [280, "Ralts", "Psychic", "Fairy"],
        [281, "Kirlia", "Psychic", "Fairy"],
        [282, "Gardevoir", "Psychic", "Fairy"],
        [283, "Surskit", "Bug", "Water"],
        [284, "Masquerain", "Bug", "Flying"],
        [285, "Shroomish", "Grass"],
        [286, "Breloom", "Grass", "Fighting"],
        [287, "Slakoth", "Normal"],
        [288, "Vigoroth", "Normal"],
        [289, "Slaking", "Normal"],
        [290, "Nincada", "Bug", "Ground"],
        [291, "Ninjask", "Bug", "Flying"],
        [292, "Shedinja", "Bug", "Ghost"],
        [293, "Whismur", "Normal"],
        [294, "Loudred", "Normal"],
        [295, "Exploud", "Normal"],
        [296, "Makuhita", "Fighting"],
        [297, "Hariyama", "Fighting"],
        [298, "Azurill", "Normal", "Fairy"],
        [299, "Nosepass", "Rock"],
        [300, "Skitty", "Normal"],
        [301, "Delcatty", "Normal"],
        [302, "Sableye", "Dark", "Ghost"],
        [303, "Mawile", "Steel", "Fairy"],
        [304, "Aron", "Steel", "Rock"],
        [305, "Lairon", "Steel", "Rock"],
        [306, "Aggron", "Steel", "Rock"],
        [307, "Meditite", "Fighting", "Psychic"],
        [308, "Medicham", "Fighting", "Psychic"],
        [309, "Electrike", "Electric"],
        [310, "Manectric", "Electric"],
        [311, "Plusle", "Electric"],
        [312, "Minun", "Electric"],
        [313, "Volbeat", "Bug"],
        [314, "Illumise", "Bug"],
        [315, "Roselia", "Grass", "Poison"],
        [316, "Gulpin", "Poison"],
        [317, "Swalot", "Poison"],
        [318, "Carvanha", "Water", "Dark"],
        [319, "Sharpedo", "Water", "Dark"],
        [320, "Wailmer", "Water"],
        [321, "Wailord", "Water"],
        [322, "Numel", "Fire", "Ground"],
        [323, "Camerupt", "Fire", "Ground"],
        [324, "Torkoal", "Fire"],
        [325, "Spoink", "Psychic"],
        [326, "Grumpig", "Psychic"],
        [327, "Spinda", "Normal"],
        [328, "Trapinch", "Ground"],
        [329, "Vibrava", "Ground", "Dragon"],
        [330, "Flygon", "Ground", "Dragon"],
        [331, "Cacnea", "Grass"],
        [332, "Cacturne", "Grass", "Dark"],
        [333, "Swablu", "Normal", "Flying"],
        [334, "Altaria", "Dragon", "Flying"],
        [335, "Zangoose", "Normal"],
        [336, "Seviper", "Poison"],
        [337, "Lunatone", "Rock", "Psychic"],
        [338, "Solrock", "Rock", "Psychic"],
        [339, "Barboach", "Water", "Ground"],
        [340, "Whiscash", "Water", "Ground"],
        [341, "Corphish", "Water"],
        [342, "Crawdaunt", "Water", "Dark"],
        [343, "Baltoy", "Ground", "Psychic"],
        [344, "Claydol", "Ground", "Psychic"],
        [345, "Lileep", "Rock", "Grass"],
        [346, "Cradily", "Rock", "Grass"],
        [347, "Anorith", "Rock", "Bug"],
        [348, "Armaldo", "Rock", "Bug"],
        [349, "Feebas", "Water"],
        [350, "Milotic", "Water"],
        [351, "Castform", "Normal"],
        [352, "Kecleon", "Normal"],
        [353, "Shuppet", "Ghost"],
        [354, "Banette", "Ghost"],
        [355, "Duskull", "Ghost"],
        [356, "Dusclops", "Ghost"],
        [357, "Tropius", "Grass", "Flying"],
        [358, "Chimecho", "Psychic"],
        [359, "Absol", "Dark"],
        [360, "Wynaut", "Psychic"],
        [361, "Snorunt", "Ice"],
        [362, "Glalie", "Ice"],
        [363, "Spheal", "Ice", "Water"],
        [364, "Sealeo", "Ice", "Water"],
        [365, "Walrein", "Ice", "Water"],
        [366, "Clamperl", "Water"],
        [367, "Huntail", "Water"],
        [368, "Gorebyss", "Water"],
        [369, "Relicanth", "Water", "Rock"],
        [370, "Luvdisc", "Water"],
        [371, "Bagon", "Dragon"],
        [372, "Shelgon", "Dragon"],
        [373, "Salamence", "Dragon", "Flying"],
        [374, "Beldum", "Steel", "Psychic"],
        [375, "Metang", "Steel", "Psychic"],
        [376, "Metagross", "Steel", "Psychic"],
        [377, "Regirock", "Rock"],
        [378, "Regice", "Ice"],
        [379, "Registeel", "Steel"],
        [380, "Latias", "Dragon", "Psychic"],
        [381, "Latios", "Dragon", "Psychic"],
        [382, "Kyogre", "Water"],
        [383, "Groudon", "Ground"],
        [384, "Rayquaza", "Dragon", "Flying"],
        [385, "Jirachi", "Steel", "Psychic"],
        [386, "Deoxys", "Psychic"]
      ]
    },
    {
      key: "sinnoh",
      label: "Sinnoh",
      stageName: "Sinnoh",
      pokemon: [
        [387, "Turtwig", "Grass"],
        [388, "Grotle", "Grass"],
        [389, "Torterra", "Grass", "Ground"],
        [390, "Chimchar", "Fire"],
        [391, "Monferno", "Fire", "Fighting"],
        [392, "Infernape", "Fire", "Fighting"],
        [393, "Piplup", "Water"],
        [394, "Prinplup", "Water"],
        [395, "Empoleon", "Water", "Steel"],
        [396, "Starly", "Normal", "Flying"],
        [397, "Staravia", "Normal", "Flying"],
        [398, "Staraptor", "Normal", "Flying"],
        [399, "Bidoof", "Normal"],
        [400, "Bibarel", "Normal", "Water"],
        [401, "Kricketot", "Bug"],
        [402, "Kricketune", "Bug"],
        [403, "Shinx", "Electric"],
        [404, "Luxio", "Electric"],
        [405, "Luxray", "Electric"],
        [406, "Budew", "Grass", "Poison"],
        [407, "Roserade", "Grass", "Poison"],
        [408, "Cranidos", "Rock"],
        [409, "Rampardos", "Rock"],
        [410, "Shieldon", "Rock", "Steel"],
        [411, "Bastiodon", "Rock", "Steel"],
        [412, "Burmy", "Bug"],
        [413, "Wormadam", "Bug", "Grass"],
        [414, "Mothim", "Bug", "Flying"],
        [415, "Combee", "Bug", "Flying"],
        [416, "Vespiquen", "Bug", "Flying"],
        [417, "Pachirisu", "Electric"],
        [418, "Buizel", "Water"],
        [419, "Floatzel", "Water"],
        [420, "Cherubi", "Grass"],
        [421, "Cherrim", "Grass"],
        [422, "Shellos", "Water"],
        [423, "Gastrodon", "Water", "Ground"],
        [424, "Ambipom", "Normal"],
        [425, "Drifloon", "Ghost", "Flying"],
        [426, "Drifblim", "Ghost", "Flying"],
        [427, "Buneary", "Normal"],
        [428, "Lopunny", "Normal"],
        [429, "Mismagius", "Ghost"],
        [430, "Honchkrow", "Dark", "Flying"],
        [431, "Glameow", "Normal"],
        [432, "Purugly", "Normal"],
        [433, "Chingling", "Psychic"],
        [434, "Stunky", "Poison", "Dark"],
        [435, "Skuntank", "Poison", "Dark"],
        [436, "Bronzor", "Steel", "Psychic"],
        [437, "Bronzong", "Steel", "Psychic"],
        [438, "Bonsly", "Rock"],
        [439, "Mime Jr.", "Psychic", "Fairy"],
        [440, "Happiny", "Normal"],
        [441, "Chatot", "Normal", "Flying"],
        [442, "Spiritomb", "Ghost", "Dark"],
        [443, "Gible", "Dragon", "Ground"],
        [444, "Gabite", "Dragon", "Ground"],
        [445, "Garchomp", "Dragon", "Ground"],
        [446, "Munchlax", "Normal"],
        [447, "Riolu", "Fighting"],
        [448, "Lucario", "Fighting", "Steel"],
        [449, "Hippopotas", "Ground"],
        [450, "Hippowdon", "Ground"],
        [451, "Skorupi", "Poison", "Bug"],
        [452, "Drapion", "Poison", "Dark"],
        [453, "Croagunk", "Poison", "Fighting"],
        [454, "Toxicroak", "Poison", "Fighting"],
        [455, "Carnivine", "Grass"],
        [456, "Finneon", "Water"],
        [457, "Lumineon", "Water"],
        [458, "Mantyke", "Water", "Flying"],
        [459, "Snover", "Grass", "Ice"],
        [460, "Abomasnow", "Grass", "Ice"],
        [461, "Weavile", "Dark", "Ice"],
        [462, "Magnezone", "Electric", "Steel"],
        [463, "Lickilicky", "Normal"],
        [464, "Rhyperior", "Ground", "Rock"],
        [465, "Tangrowth", "Grass"],
        [466, "Electivire", "Electric"],
        [467, "Magmortar", "Fire"],
        [468, "Togekiss", "Fairy", "Flying"],
        [469, "Yanmega", "Bug", "Flying"],
        [470, "Leafeon", "Grass"],
        [471, "Glaceon", "Ice"],
        [472, "Gliscor", "Ground", "Flying"],
        [473, "Mamoswine", "Ice", "Ground"],
        [474, "Porygon-Z", "Normal"],
        [475, "Gallade", "Psychic", "Fighting"],
        [476, "Probopass", "Rock", "Steel"],
        [477, "Dusknoir", "Ghost"],
        [478, "Froslass", "Ice", "Ghost"],
        [479, "Rotom", "Electric", "Ghost"],
        [480, "Uxie", "Psychic"],
        [481, "Mesprit", "Psychic"],
        [482, "Azelf", "Psychic"],
        [483, "Dialga", "Steel", "Dragon"],
        [484, "Palkia", "Water", "Dragon"],
        [485, "Heatran", "Fire", "Steel"],
        [486, "Regigigas", "Normal"],
        [487, "Giratina", "Ghost", "Dragon"],
        [488, "Cresselia", "Psychic"],
        [489, "Phione", "Water"],
        [490, "Manaphy", "Water"],
        [491, "Darkrai", "Dark"],
        [492, "Shaymin", "Grass"],
        [493, "Arceus", "Normal"]
      ]
    },
    {
      key: "unova",
      label: "Unova",
      stageName: "Unova",
      pokemon: [
        [494, "Victini", "Psychic", "Fire"],
        [495, "Snivy", "Grass"],
        [496, "Servine", "Grass"],
        [497, "Serperior", "Grass"],
        [498, "Tepig", "Fire"],
        [499, "Pignite", "Fire", "Fighting"],
        [500, "Emboar", "Fire", "Fighting"],
        [501, "Oshawott", "Water"],
        [502, "Dewott", "Water"],
        [503, "Samurott", "Water"],
        [504, "Patrat", "Normal"],
        [505, "Watchog", "Normal"],
        [506, "Lillipup", "Normal"],
        [507, "Herdier", "Normal"],
        [508, "Stoutland", "Normal"],
        [509, "Purrloin", "Dark"],
        [510, "Liepard", "Dark"],
        [511, "Pansage", "Grass"],
        [512, "Simisage", "Grass"],
        [513, "Pansear", "Fire"],
        [514, "Simisear", "Fire"],
        [515, "Panpour", "Water"],
        [516, "Simipour", "Water"],
        [517, "Munna", "Psychic"],
        [518, "Musharna", "Psychic"],
        [519, "Pidove", "Normal", "Flying"],
        [520, "Tranquill", "Normal", "Flying"],
        [521, "Unfezant", "Normal", "Flying"],
        [522, "Blitzle", "Electric"],
        [523, "Zebstrika", "Electric"],
        [524, "Roggenrola", "Rock"],
        [525, "Boldore", "Rock"],
        [526, "Gigalith", "Rock"],
        [527, "Woobat", "Psychic", "Flying"],
        [528, "Swoobat", "Psychic", "Flying"],
        [529, "Drilbur", "Ground"],
        [530, "Excadrill", "Ground", "Steel"],
        [531, "Audino", "Normal"],
        [532, "Timburr", "Fighting"],
        [533, "Gurdurr", "Fighting"],
        [534, "Conkeldurr", "Fighting"],
        [535, "Tympole", "Water"],
        [536, "Palpitoad", "Water", "Ground"],
        [537, "Seismitoad", "Water", "Ground"],
        [538, "Throh", "Fighting"],
        [539, "Sawk", "Fighting"],
        [540, "Sewaddle", "Bug", "Grass"],
        [541, "Swadloon", "Bug", "Grass"],
        [542, "Leavanny", "Bug", "Grass"],
        [543, "Venipede", "Bug", "Poison"],
        [544, "Whirlipede", "Bug", "Poison"],
        [545, "Scolipede", "Bug", "Poison"],
        [546, "Cottonee", "Grass", "Fairy"],
        [547, "Whimsicott", "Grass", "Fairy"],
        [548, "Petilil", "Grass"],
        [549, "Lilligant", "Grass"],
        [550, "Basculin", "Water"],
        [551, "Sandile", "Ground", "Dark"],
        [552, "Krokorok", "Ground", "Dark"],
        [553, "Krookodile", "Ground", "Dark"],
        [554, "Darumaka", "Fire"],
        [555, "Darmanitan", "Fire"],
        [556, "Maractus", "Grass"],
        [557, "Dwebble", "Bug", "Rock"],
        [558, "Crustle", "Bug", "Rock"],
        [559, "Scraggy", "Dark", "Fighting"],
        [560, "Scrafty", "Dark", "Fighting"],
        [561, "Sigilyph", "Psychic", "Flying"],
        [562, "Yamask", "Ghost"],
        [563, "Cofagrigus", "Ghost"],
        [564, "Tirtouga", "Water", "Rock"],
        [565, "Carracosta", "Water", "Rock"],
        [566, "Archen", "Rock", "Flying"],
        [567, "Archeops", "Rock", "Flying"],
        [568, "Trubbish", "Poison"],
        [569, "Garbodor", "Poison"],
        [570, "Zorua", "Dark"],
        [571, "Zoroark", "Dark"],
        [572, "Minccino", "Normal"],
        [573, "Cinccino", "Normal"],
        [574, "Gothita", "Psychic"],
        [575, "Gothorita", "Psychic"],
        [576, "Gothitelle", "Psychic"],
        [577, "Solosis", "Psychic"],
        [578, "Duosion", "Psychic"],
        [579, "Reuniclus", "Psychic"],
        [580, "Ducklett", "Water", "Flying"],
        [581, "Swanna", "Water", "Flying"],
        [582, "Vanillite", "Ice"],
        [583, "Vanillish", "Ice"],
        [584, "Vanilluxe", "Ice"],
        [585, "Deerling", "Normal", "Grass"],
        [586, "Sawsbuck", "Normal", "Grass"],
        [587, "Emolga", "Electric", "Flying"],
        [588, "Karrablast", "Bug"],
        [589, "Escavalier", "Bug", "Steel"],
        [590, "Foongus", "Grass", "Poison"],
        [591, "Amoonguss", "Grass", "Poison"],
        [592, "Frillish", "Water", "Ghost"],
        [593, "Jellicent", "Water", "Ghost"],
        [594, "Alomomola", "Water"],
        [595, "Joltik", "Bug", "Electric"],
        [596, "Galvantula", "Bug", "Electric"],
        [597, "Ferroseed", "Grass", "Steel"],
        [598, "Ferrothorn", "Grass", "Steel"],
        [599, "Klink", "Steel"],
        [600, "Klang", "Steel"],
        [601, "Klinklang", "Steel"],
        [602, "Tynamo", "Electric"],
        [603, "Eelektrik", "Electric"],
        [604, "Eelektross", "Electric"],
        [605, "Elgyem", "Psychic"],
        [606, "Beheeyem", "Psychic"],
        [607, "Litwick", "Ghost", "Fire"],
        [608, "Lampent", "Ghost", "Fire"],
        [609, "Chandelure", "Ghost", "Fire"],
        [610, "Axew", "Dragon"],
        [611, "Fraxure", "Dragon"],
        [612, "Haxorus", "Dragon"],
        [613, "Cubchoo", "Ice"],
        [614, "Beartic", "Ice"],
        [615, "Cryogonal", "Ice"],
        [616, "Shelmet", "Bug"],
        [617, "Accelgor", "Bug"],
        [618, "Stunfisk", "Ground", "Electric"],
        [619, "Mienfoo", "Fighting"],
        [620, "Mienshao", "Fighting"],
        [621, "Druddigon", "Dragon"],
        [622, "Golett", "Ground", "Ghost"],
        [623, "Golurk", "Ground", "Ghost"],
        [624, "Pawniard", "Dark", "Steel"],
        [625, "Bisharp", "Dark", "Steel"],
        [626, "Bouffalant", "Normal"],
        [627, "Rufflet", "Normal", "Flying"],
        [628, "Braviary", "Normal", "Flying"],
        [629, "Vullaby", "Dark", "Flying"],
        [630, "Mandibuzz", "Dark", "Flying"],
        [631, "Heatmor", "Fire"],
        [632, "Durant", "Bug", "Steel"],
        [633, "Deino", "Dark", "Dragon"],
        [634, "Zweilous", "Dark", "Dragon"],
        [635, "Hydreigon", "Dark", "Dragon"],
        [636, "Larvesta", "Bug", "Fire"],
        [637, "Volcarona", "Bug", "Fire"],
        [638, "Cobalion", "Steel", "Fighting"],
        [639, "Terrakion", "Rock", "Fighting"],
        [640, "Virizion", "Grass", "Fighting"],
        [641, "Tornadus", "Flying"],
        [642, "Thundurus", "Electric", "Flying"],
        [643, "Reshiram", "Dragon", "Fire"],
        [644, "Zekrom", "Dragon", "Electric"],
        [645, "Landorus", "Ground", "Flying"],
        [646, "Kyurem", "Dragon", "Ice"],
        [647, "Keldeo", "Water", "Fighting"],
        [648, "Meloetta", "Normal", "Psychic"],
        [649, "Genesect", "Bug", "Steel"]
      ]
    }
  ];

  const REGION_KEYS = REGION_DEFINITIONS.map((region) => region.key);

  const TYPE_COLORS = {
    Normal: ["#a8a878", "#f8f8f8"],
    Fire: ["#f08030", "#111827"],
    Water: ["#6890f0", "#f8fafc"],
    Electric: ["#f8d030", "#111827"],
    Grass: ["#78c850", "#111827"],
    Ice: ["#98d8d8", "#111827"],
    Fighting: ["#c03028", "#f8fafc"],
    Poison: ["#a040a0", "#f8fafc"],
    Ground: ["#e0c068", "#111827"],
    Flying: ["#a890f0", "#111827"],
    Psychic: ["#f85888", "#f8fafc"],
    Bug: ["#a8b820", "#111827"],
    Rock: ["#b8a038", "#f8fafc"],
    Ghost: ["#705898", "#f8fafc"],
    Dragon: ["#7038f8", "#f8fafc"],
    Dark: ["#705848", "#f8fafc"],
    Steel: ["#b8b8d0", "#111827"],
    Fairy: ["#ee99ac", "#111827"]
  };

  const REGIONS = REGION_DEFINITIONS.map((region) => ({
    ...region,
    pokemon: region.pokemon.map(([id, name, ...types]) => ({ id, name, types }))
  }));

  const REGION_BY_KEY = new Map(REGIONS.map((region) => [region.key, region]));

  const REGION_DEFAULT_POKEMON = {
    kanto: "Charmander",
    johto: "Chikorita",
    hoenn: "Treecko",
    sinnoh: "Turtwig",
    unova: "Snivy"
  };

  const REGION_DEFAULT_STARTER = {
    kanto: "Magnemite",
    johto: "Chikorita",
    hoenn: "Treecko",
    sinnoh: "Turtwig",
    unova: "Snivy"
  };

  const SELECTORS = {
    pokemonCards: [
      ".poke-choice-wrap",
      ".poke-card",
      ".starter-card",
      ".starter-option",
      ".starter-card-row .poke-card",
      "#catch-choices .poke-card",
      "#starter-choices .poke-card",
      ".pc-box .dex-card",
      ".pc-dex-card",
      ".dex-card",
      "[class*='card']"
    ],
    pokemonName: ".poke-name, .dex-name, [class*='poke-name'], [class*='dex-name']",
    shiny: [
      ".shiny-badge",
      "img.poke-sprite.shiny",
      "img.shiny",
      "img[src*='/shiny/']",
      "[class*='shiny']"
    ],
    catchIcons: [
      "image[href='sprites/catchPokemon.png']",
      "image[href$='catchPokemon.png']",
      "img[src$='catchPokemon.png']"
    ],
    mapClickables: [
      "#map-container [role='button']",
      "#map-container [tabindex]",
      "#map-container [onclick]",
      "#map-container [style*='cursor']",
      "#map-container .map-node--clickable",
      "#map-container .map-node",
      "#map-container button"
    ],
    newRunButton: "#btn-new-run"
  };

  const STATE_TIMEOUTS = {
    [STATES.ENTER_MAIN_MENU]: 12000,
    [STATES.ENTER_BATTLE_TOWER]: 16000,
    [STATES.SELECT_REGION]: 22000,
    [STATES.SELECT_STARTER]: 16000,
    [STATES.OPEN_FIRST_CATCH_NODE]: 25000,
    [STATES.WAIT_FOR_POKEMON_CHOICES]: 18000,
    [STATES.CHECK_FOR_SHINY_TARGET]: 10000,
    [STATES.CATCH_TARGET]: 10000,
    [STATES.RESET_RUN]: 25000
  };

  const runtime = {
    running: false,
    paused: false,
    state: STATES.IDLE,
    attempts: readNumber("attempts", 0, 0, Number.MAX_SAFE_INTEGER),
    consecutiveErrors: 0,
    lastError: "",
    lastMessage: "",
    lastScreen: "",
    foundCard: null,
    foundMessage: "",
    stopReason: "",
    loopToken: 0,
    overlayHidden: readBool("overlayHidden", false),
    updateChecking: false,
    updateLatestVersion: "",
    updateMessage: "Not checked.",
    updateAvailable: false,
    logs: []
  };

  const settings = loadSettings();

  let overlay = null;
  let overlayFields = {};
  let overlayResizeObserver = null;
  let overlayDrag = null;
  let suppressOverlayClickUntil = 0;
  let activeOverlayTab = readOverlayTab();

  function storageKey(name) {
    return `${STORAGE_PREFIX}${name}`;
  }

  function readNumber(name, fallback, min, max) {
    try {
      const raw = localStorage.getItem(storageKey(name));
      if (raw === null || raw === "") return fallback;
      const value = Number(raw);
      if (!Number.isFinite(value)) return fallback;
      return Math.min(max, Math.max(min, value));
    } catch (error) {
      return fallback;
    }
  }

  function readBool(name, fallback) {
    try {
      const raw = localStorage.getItem(storageKey(name));
      if (raw === null) return fallback;
      return raw === "true";
    } catch (error) {
      return fallback;
    }
  }

  function readString(name, fallback) {
    try {
      const raw = localStorage.getItem(storageKey(name));
      return sanitizePokemonName(raw) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function readRegion(name, fallback) {
    try {
      return normalizeRegionKey(localStorage.getItem(storageKey(name)) || fallback);
    } catch (error) {
      return normalizeRegionKey(fallback);
    }
  }

  function normalizeOverlayTab(value) {
    return Object.prototype.hasOwnProperty.call(PANEL_DEFAULT_HEIGHTS, value) ? value : "status";
  }

  function readOverlayTab() {
    try {
      return normalizeOverlayTab(localStorage.getItem(storageKey("activeTab")) || "status");
    } catch (error) {
      return "status";
    }
  }

  function panelHeightKey(tabName) {
    return `panelHeight_${normalizeOverlayTab(tabName)}`;
  }

  function defaultPanelHeight(tabName) {
    return PANEL_DEFAULT_HEIGHTS[normalizeOverlayTab(tabName)];
  }

  function sanitizePokemonName(value) {
    return String(value || "")
      .replace(/[^A-Za-z0-9 .'-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 32);
  }

  function normalizeRegionKey(value) {
    const key = String(value || "").toLowerCase().trim();
    return REGION_KEYS.includes(key) ? key : CONFIG.region;
  }

  function selectedRegion() {
    return REGION_BY_KEY.get(normalizeRegionKey(settings.region)) || REGION_BY_KEY.get(CONFIG.region);
  }

  function getRegionPokemon(regionKey = settings.region) {
    const region = REGION_BY_KEY.get(normalizeRegionKey(regionKey)) || REGION_BY_KEY.get(CONFIG.region);
    return region ? region.pokemon : [];
  }

  function findPokemonOption(name, regionKey = settings.region) {
    const target = normalizeForCompare(name);
    if (!target) return null;
    return getRegionPokemon(regionKey).find((pokemon) => normalizeForCompare(pokemon.name) === target) || null;
  }

  function defaultPokemonForRegion(regionKey = settings.region, settingName = "targetPokemon") {
    const options = getRegionPokemon(regionKey);
    const key = normalizeRegionKey(regionKey);
    const preferred = settingName === "starterPokemon" ? REGION_DEFAULT_STARTER[key] : REGION_DEFAULT_POKEMON[key];
    const preferredOption = preferred && options.find((pokemon) => normalizeForCompare(pokemon.name) === normalizeForCompare(preferred));
    if (preferredOption) return preferredOption.name;
    return options[0] ? options[0].name : CONFIG.targetPokemon;
  }

  function pokemonSpriteUrl(pokemon) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
  }

  function renderTypeBadges(types) {
    return types.map((type) => {
      const colors = TYPE_COLORS[type] || ["#64748b", "#f8fafc"];
      return `<span class="pkh-type" style="--pkh-type-bg:${escapeHtml(colors[0])};--pkh-type-fg:${escapeHtml(colors[1])}">${escapeHtml(type.toUpperCase())}</span>`;
    }).join("");
  }

  function writeStorage(name, value) {
    try {
      localStorage.setItem(storageKey(name), String(value));
    } catch (error) {
      log(`Could not persist ${name}: ${error.message || error}`);
    }
  }

  function removeStorage(name) {
    try {
      localStorage.removeItem(storageKey(name));
    } catch (error) {
      log(`Could not remove ${name}: ${error.message || error}`);
    }
  }

  function migratePanelLayoutDefaults() {
    try {
      if (localStorage.getItem(storageKey("panelLayoutVersion")) === PANEL_LAYOUT_VERSION) return;
      Object.keys(PANEL_DEFAULT_HEIGHTS).forEach((tabName) => removeStorage(panelHeightKey(tabName)));
      writeStorage("panelLayoutVersion", PANEL_LAYOUT_VERSION);
    } catch (error) {
      log(`Could not migrate panel layout: ${error.message || error}`);
    }
  }

  function loadSettings() {
    return {
      region: readRegion("region", CONFIG.region),
      targetPokemon: readString("targetPokemon", CONFIG.targetPokemon),
      starterPokemon: readString("starterPokemon", CONFIG.starterPokemon),
      minDelayMs: readNumber("minDelayMs", CONFIG.minDelayMs, 0, 60000),
      maxDelayMs: readNumber("maxDelayMs", CONFIG.maxDelayMs, 0, 60000),
      stopAfterAttempts: readNumber("stopAfterAttempts", CONFIG.stopAfterAttempts, 0, Number.MAX_SAFE_INTEGER),
      autoCatch: readBool("autoCatch", CONFIG.autoCatch),
      useChoiceRerolls: readBool("useChoiceRerolls", CONFIG.useChoiceRerolls),
      stopOnAnyShiny: readBool("stopOnAnyShiny", CONFIG.stopOnAnyShiny),
      dryRun: readBool("dryRun", CONFIG.dryRun),
      autoResume: readBool("autoResume", CONFIG.autoResume)
    };
  }

  function persistSettings() {
    settings.region = normalizeRegionKey(settings.region);
    settings.targetPokemon = sanitizePokemonName(settings.targetPokemon) || CONFIG.targetPokemon;
    settings.starterPokemon = sanitizePokemonName(settings.starterPokemon) || CONFIG.starterPokemon;
    const minDelay = Math.max(0, Number(settings.minDelayMs) || CONFIG.minDelayMs);
    const maxDelay = Math.max(0, Number(settings.maxDelayMs) || CONFIG.maxDelayMs);
    settings.minDelayMs = Math.min(minDelay, maxDelay);
    settings.maxDelayMs = Math.max(minDelay, maxDelay);
    settings.stopAfterAttempts = Math.max(0, Math.floor(Number(settings.stopAfterAttempts) || 0));

    writeStorage("region", settings.region);
    writeStorage("targetPokemon", settings.targetPokemon);
    writeStorage("starterPokemon", settings.starterPokemon);
    writeStorage("minDelayMs", settings.minDelayMs);
    writeStorage("maxDelayMs", settings.maxDelayMs);
    writeStorage("stopAfterAttempts", settings.stopAfterAttempts);
    writeStorage("autoCatch", settings.autoCatch);
    writeStorage("useChoiceRerolls", settings.useChoiceRerolls);
    writeStorage("stopOnAnyShiny", settings.stopOnAnyShiny);
    writeStorage("dryRun", settings.dryRun);
    writeStorage("autoResume", settings.autoResume);
    updateOverlay();
  }

  function persistAttempts() {
    writeStorage("attempts", runtime.attempts);
  }

  function resetAttemptsForNewTarget() {
    runtime.attempts = 0;
    persistAttempts();
    runtime.foundMessage = "";
  }

  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getDefaultPanelLayout(tabName = activeOverlayTab) {
    const width = clampNumber(DEFAULT_PANEL_WIDTH, MIN_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, window.innerWidth - 24));
    const height = clampNumber(defaultPanelHeight(tabName), MIN_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, window.innerHeight - 24));
    return {
      left: clampNumber(window.innerWidth - width - DEFAULT_PANEL_RIGHT, 8, Math.max(8, window.innerWidth - 80)),
      top: DEFAULT_PANEL_TOP,
      width,
      height
    };
  }

  function getDefaultRestoreLayout() {
    return {
      left: clampNumber(window.innerWidth - DEFAULT_RESTORE_RIGHT - DEFAULT_RESTORE_WIDTH, 8, Math.max(8, window.innerWidth - DEFAULT_RESTORE_WIDTH)),
      top: DEFAULT_PANEL_TOP,
      width: DEFAULT_RESTORE_WIDTH,
      height: DEFAULT_RESTORE_HEIGHT
    };
  }

  function readPanelLayout(tabName = activeOverlayTab) {
    const normalizedTab = normalizeOverlayTab(tabName);
    const fallback = getDefaultPanelLayout(normalizedTab);
    const width = readNumber("panelWidth", fallback.width, MIN_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, window.innerWidth - 8));
    const height = readNumber(panelHeightKey(normalizedTab), fallback.height, MIN_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, window.innerHeight - 8));
    return {
      left: readNumber("panelLeft", fallback.left, 0, Math.max(0, window.innerWidth - 48)),
      top: readNumber("panelTop", fallback.top, 0, Math.max(0, window.innerHeight - 48)),
      width,
      height
    };
  }

  function readRestoreLayout() {
    const fallback = getDefaultRestoreLayout();
    return {
      left: readNumber("restoreLeft", fallback.left, 0, Math.max(0, window.innerWidth - 48)),
      top: readNumber("restoreTop", fallback.top, 0, Math.max(0, window.innerHeight - 48)),
      width: readNumber("restoreWidth", fallback.width, 44, 160),
      height: readNumber("restoreHeight", fallback.height, 34, 120)
    };
  }

  function clampPanelLayout(layout) {
    const width = clampNumber(layout.width, MIN_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, window.innerWidth - 8));
    const height = clampNumber(layout.height, MIN_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, window.innerHeight - 8));
    return {
      left: clampNumber(layout.left, 0, Math.max(0, window.innerWidth - 48)),
      top: clampNumber(layout.top, 0, Math.max(0, window.innerHeight - 48)),
      width,
      height
    };
  }

  function clampRestoreLayout(layout) {
    const width = clampNumber(layout.width || DEFAULT_RESTORE_WIDTH, 44, 160);
    const height = clampNumber(layout.height || DEFAULT_RESTORE_HEIGHT, 34, 120);
    return {
      left: clampNumber(layout.left, 0, Math.max(0, window.innerWidth - 48)),
      top: clampNumber(layout.top, 0, Math.max(0, window.innerHeight - 32)),
      width,
      height
    };
  }

  function applyOverlayLayout() {
    if (!overlay) return;
    if (runtime.overlayHidden) {
      const layout = clampRestoreLayout(readRestoreLayout());
      overlay.style.left = `${layout.left}px`;
      overlay.style.top = `${layout.top}px`;
      overlay.style.right = "auto";
      overlay.style.width = `${layout.width}px`;
      overlay.style.height = `${layout.height}px`;
      return;
    }

    const layout = clampPanelLayout(readPanelLayout(activeOverlayTab));
    overlay.style.left = `${layout.left}px`;
    overlay.style.top = `${layout.top}px`;
    overlay.style.right = "auto";
    overlay.style.width = `${layout.width}px`;
    overlay.style.height = `${layout.height}px`;
  }

  function persistPanelLayout(tabName = activeOverlayTab) {
    if (!overlay || runtime.overlayHidden) return;
    const normalizedTab = normalizeOverlayTab(tabName);
    const rect = overlay.getBoundingClientRect();
    const layout = clampPanelLayout({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    });
    writeStorage("panelLeft", Math.round(layout.left));
    writeStorage("panelTop", Math.round(layout.top));
    writeStorage("panelWidth", Math.round(layout.width));
    writeStorage("panelHeight", Math.round(layout.height));
    writeStorage(panelHeightKey(normalizedTab), Math.round(layout.height));
  }

  function persistRestoreLayout() {
    if (!overlay || !runtime.overlayHidden) return;
    const rect = overlay.getBoundingClientRect();
    const layout = clampRestoreLayout({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    });
    writeStorage("restoreLeft", Math.round(layout.left));
    writeStorage("restoreTop", Math.round(layout.top));
    writeStorage("restoreWidth", Math.round(layout.width));
    writeStorage("restoreHeight", Math.round(layout.height));
  }

  function persistCurrentOverlayLayout() {
    if (runtime.overlayHidden) persistRestoreLayout();
    else persistPanelLayout();
  }

  function setupOverlayResizePersistence() {
    if (overlayResizeObserver) overlayResizeObserver.disconnect();
    if (typeof ResizeObserver !== "function") return;

    overlayResizeObserver = new ResizeObserver(() => {
      if (!overlay || overlayDrag) return;
      persistCurrentOverlayLayout();
    });
    overlayResizeObserver.observe(overlay);
  }

  function setupOverlayDragging() {
    overlay.addEventListener("pointerdown", (event) => {
      const header = event.target.closest(".pkh-head");
      const restoreHandle = event.target.closest(".pkh-restore-drag");
      if (!restoreHandle && !header) return;
      if (header && event.target.closest("button")) return;

      const rect = overlay.getBoundingClientRect();
      overlayDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        left: rect.left,
        top: rect.top,
        moved: false
      };
      try {
        overlay.setPointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture can fail in unusual browser states; document listeners still work.
      }
    });

    overlay.addEventListener("pointermove", (event) => {
      if (!overlayDrag || overlayDrag.pointerId !== event.pointerId) return;

      const dx = event.clientX - overlayDrag.startX;
      const dy = event.clientY - overlayDrag.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) overlayDrag.moved = true;
      if (!overlayDrag.moved) return;

      const maxLeft = Math.max(0, window.innerWidth - 48);
      const maxTop = Math.max(0, window.innerHeight - 32);
      overlay.style.left = `${clampNumber(overlayDrag.left + dx, 0, maxLeft)}px`;
      overlay.style.top = `${clampNumber(overlayDrag.top + dy, 0, maxTop)}px`;
      overlay.style.right = "auto";
      event.preventDefault();
    });

    overlay.addEventListener("pointerup", (event) => {
      if (!overlayDrag || overlayDrag.pointerId !== event.pointerId) return;
      if (overlayDrag.moved) suppressOverlayClickUntil = Date.now() + 350;
      overlayDrag = null;
      persistCurrentOverlayLayout();
    });

    overlay.addEventListener("pointercancel", () => {
      overlayDrag = null;
      persistCurrentOverlayLayout();
    });
  }

  // ---------------------------------------------------------------------------
  // Overlay UI
  // ---------------------------------------------------------------------------

  function createOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;

    const style = document.createElement("style");
    style.textContent = `
      #${OVERLAY_ID} {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 2147483646;
        width: min(360px, calc(100vw - 24px));
        height: min(${PANEL_DEFAULT_HEIGHTS.status}px, calc(100vh - 24px));
        min-width: ${MIN_PANEL_WIDTH}px;
        min-height: ${MIN_PANEL_HEIGHT}px;
        max-height: calc(100vh - 24px);
        overflow: auto;
        resize: both;
        background: #111827;
        color: #f8fafc;
        border: 1px solid #475569;
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
        border-radius: 8px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 13px;
        line-height: 1.35;
      }
      #${OVERLAY_ID}[data-hidden="true"] {
        width: auto;
        height: auto;
        min-width: 0;
        min-height: 0;
        max-height: none;
        overflow: auto;
        resize: both;
        background: transparent;
        border: 0;
        box-shadow: none;
        right: 56px;
      }
      #${OVERLAY_ID}[data-hidden="true"] .pkh-head,
      #${OVERLAY_ID}[data-hidden="true"] .pkh-body {
        display: none;
      }
      #${OVERLAY_ID} .pkh-restore {
        display: none;
        position: relative;
        width: 100%;
        height: 100%;
      }
      #${OVERLAY_ID}[data-hidden="true"] .pkh-restore {
        display: block;
      }
      #${OVERLAY_ID} .pkh-restore-drag {
        display: none;
        position: absolute;
        top: 2px;
        left: 2px;
        z-index: 2;
        width: 10px;
        height: 10px;
        border-radius: 2px;
        background: #38bdf8;
        box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.85);
        cursor: move;
      }
      #${OVERLAY_ID}[data-hidden="true"] .pkh-restore-drag {
        display: block;
      }
      #${OVERLAY_ID} .pkh-restore button {
        width: 100%;
        height: 100%;
        background: #0f172a;
        border-color: #38bdf8;
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
        font-weight: 700;
        display: grid;
        gap: 2px;
        min-width: 48px;
        padding: 5px 8px;
        text-align: center;
        line-height: 1.05;
        cursor: pointer;
      }
      #${OVERLAY_ID} .pkh-restore-main {
        font-size: 11px;
      }
      #${OVERLAY_ID} .pkh-restore-sub {
        font-size: 10px;
        color: #7dd3fc;
      }
      #${OVERLAY_ID} * {
        box-sizing: border-box;
      }
      #${OVERLAY_ID} .pkh-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-bottom: 1px solid #334155;
        background: #0f172a;
        cursor: move;
      }
      #${OVERLAY_ID} .pkh-head button {
        cursor: pointer;
      }
      #${OVERLAY_ID} .pkh-title {
        font-weight: 700;
        font-size: 13px;
      }
      #${OVERLAY_ID} .pkh-body {
        display: grid;
        gap: 10px;
        padding: 12px;
      }
      #${OVERLAY_ID} .pkh-tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
      }
      #${OVERLAY_ID} .pkh-tab {
        padding: 5px 6px;
        border-color: #334155;
        background: #0f172a;
        color: #cbd5e1;
        font-size: 12px;
      }
      #${OVERLAY_ID} .pkh-tab[data-active="true"] {
        background: #1e293b;
        border-color: #38bdf8;
        color: #f8fafc;
      }
      #${OVERLAY_ID} .pkh-panel {
        display: none;
        gap: 10px;
      }
      #${OVERLAY_ID} .pkh-panel[data-active="true"] {
        display: grid;
      }
      #${OVERLAY_ID} .pkh-row,
      #${OVERLAY_ID} .pkh-buttons {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      #${OVERLAY_ID} .pkh-hunt-actions {
        justify-content: flex-end;
      }
      #${OVERLAY_ID} button {
        border: 1px solid #64748b;
        border-radius: 6px;
        background: #1f2937;
        color: #f8fafc;
        padding: 6px 9px;
        cursor: pointer;
        font: inherit;
      }
      #${OVERLAY_ID} button:hover {
        background: #334155;
      }
      #${OVERLAY_ID} button[data-kind="start"] {
        background: #166534;
        border-color: #22c55e;
      }
      #${OVERLAY_ID} button[data-kind="stop"] {
        background: #7f1d1d;
        border-color: #ef4444;
      }
      #${OVERLAY_ID} .pkh-grid {
        display: grid;
        grid-template-columns: minmax(92px, auto) 1fr;
        gap: 6px 8px;
      }
      #${OVERLAY_ID} .pkh-label {
        color: #cbd5e1;
      }
      #${OVERLAY_ID} .pkh-value {
        color: #fff;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      #${OVERLAY_ID} input[type="number"] {
        width: 92px;
        border: 1px solid #475569;
        border-radius: 6px;
        background: #020617;
        color: #f8fafc;
        padding: 5px 7px;
        font: inherit;
      }
      #${OVERLAY_ID} select,
      #${OVERLAY_ID} input[type="text"] {
        width: 130px;
        border: 1px solid #475569;
        border-radius: 6px;
        background: #020617;
        color: #f8fafc;
        padding: 5px 7px;
        font: inherit;
      }
      #${OVERLAY_ID} select {
        width: 140px;
      }
      #${OVERLAY_ID} .pkh-picker-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      #${OVERLAY_ID} .pkh-picker {
        position: relative;
        display: grid;
        gap: 4px;
      }
      #${OVERLAY_ID} .pkh-picker label {
        display: block;
      }
      #${OVERLAY_ID} .pkh-picker-control {
        display: grid;
        grid-template-columns: 24px minmax(72px, 1fr) minmax(0, max-content);
        align-items: center;
        gap: 6px;
        min-height: 38px;
        padding: 4px 6px;
        border: 1px solid #475569;
        border-radius: 6px;
        background: #020617;
      }
      #${OVERLAY_ID} .pkh-picker-control[data-empty="true"] {
        grid-template-columns: minmax(0, 1fr);
      }
      #${OVERLAY_ID} .pkh-picker-control[data-empty="true"] .pkh-pokemon-sprite,
      #${OVERLAY_ID} .pkh-picker-control[data-empty="true"] [data-picker-selected-types] {
        display: none;
      }
      #${OVERLAY_ID} .pkh-picker-control:focus-within {
        border-color: #38bdf8;
        box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.25);
      }
      #${OVERLAY_ID} .pkh-picker-name-wrap {
        position: relative;
        display: block;
        min-width: 0;
      }
      #${OVERLAY_ID} .pkh-picker-control input[type="text"] {
        position: relative;
        z-index: 2;
        width: 100%;
        min-width: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        padding: 0;
        color: #f8fafc;
        font-weight: 700;
        outline: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #${OVERLAY_ID} .pkh-picker-menu {
        display: none;
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: 2147483647;
        max-height: min(340px, calc(100vh - 190px));
        overflow: auto;
        border: 1px solid #475569;
        border-radius: 6px;
        background: #020617;
        box-shadow: 0 16px 34px rgba(0, 0, 0, 0.45);
      }
      #${OVERLAY_ID} .pkh-picker-menu[data-open="true"] {
        display: block;
      }
      #${OVERLAY_ID} .pkh-picker-option {
        width: 100%;
        display: grid;
        grid-template-columns: 24px minmax(72px, 1fr) minmax(0, max-content);
        align-items: center;
        gap: 6px;
        padding: 5px 6px;
        border: 0;
        border-radius: 0;
        background: transparent;
        text-align: left;
      }
      #${OVERLAY_ID} .pkh-picker-option:hover,
      #${OVERLAY_ID} .pkh-picker-option:focus,
      #${OVERLAY_ID} .pkh-picker-option[data-active="true"] {
        background: #1e293b;
      }
      #${OVERLAY_ID} .pkh-pokemon-sprite {
        width: 22px;
        height: 22px;
        object-fit: contain;
        image-rendering: pixelated;
      }
      #${OVERLAY_ID} .pkh-pokemon-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #f8fafc;
      }
      #${OVERLAY_ID} .pkh-type-list {
        display: flex;
        gap: 3px;
        flex-wrap: nowrap;
        justify-content: flex-end;
        min-width: 0;
        overflow: hidden;
      }
      #${OVERLAY_ID} .pkh-type {
        display: inline-block;
        min-width: 29px;
        padding: 2px 4px;
        border-radius: 2px;
        background: var(--pkh-type-bg);
        color: var(--pkh-type-fg);
        font-size: 7px;
        font-weight: 800;
        line-height: 1.1;
        text-align: center;
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.45);
        flex: 0 0 auto;
      }
      #${OVERLAY_ID} .pkh-picker-empty {
        padding: 8px;
        color: #94a3b8;
        font-size: 12px;
      }
      #${OVERLAY_ID} label {
        display: flex;
        gap: 7px;
        align-items: flex-start;
        color: #e2e8f0;
      }
      #${OVERLAY_ID} input[type="checkbox"] {
        margin-top: 2px;
      }
      #${OVERLAY_ID} .pkh-disclaimer {
        padding: 8px;
        border: 1px solid #854d0e;
        border-radius: 6px;
        color: #fde68a;
        background: #451a03;
      }
      #${OVERLAY_ID} .pkh-found {
        display: none;
        padding: 10px;
        border-radius: 6px;
        background: #14532d;
        border: 1px solid #22c55e;
        color: #dcfce7;
        font-weight: 700;
        text-align: center;
      }
      #${OVERLAY_ID} .pkh-found[data-show="true"] {
        display: block;
      }
      #${OVERLAY_ID} .pkh-log {
        max-height: 150px;
        overflow: auto;
        padding: 8px;
        border-radius: 6px;
        background: #020617;
        border: 1px solid #1e293b;
        color: #cbd5e1;
        font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
        font-size: 11px;
        white-space: pre-wrap;
      }
      @media (max-width: 420px) {
        #${OVERLAY_ID} .pkh-picker-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);

    const initialTab = normalizeOverlayTab(activeOverlayTab);
    activeOverlayTab = initialTab;

    overlay = document.createElement("section");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("aria-label", "Pokelike Shiny Hunter");
    overlay.dataset.hidden = String(runtime.overlayHidden);
    overlay.innerHTML = `
      <div class="pkh-restore">
        <span class="pkh-restore-drag" title="Drag hidden bot" aria-hidden="true"></span>
        <button type="button" data-action="show"><span class="pkh-restore-main">bot</span><span class="pkh-restore-sub">show</span></button>
      </div>
      <div class="pkh-head">
        <div class="pkh-title">Shiny Hunter - v${escapeHtml(SCRIPT_VERSION)}</div>
        <button type="button" data-action="hide">Hide</button>
      </div>
      <div class="pkh-body">
        <div class="pkh-disclaimer">${escapeHtml(DISCLAIMER)}</div>
        <div class="pkh-found" data-field="found">Shiny target found!</div>
        <div class="pkh-tabs" role="tablist">
          <button type="button" class="pkh-tab" data-tab="status" data-active="${String(initialTab === "status")}">Status</button>
          <button type="button" class="pkh-tab" data-tab="hunt" data-active="${String(initialTab === "hunt")}">Hunt</button>
          <button type="button" class="pkh-tab" data-tab="settings" data-active="${String(initialTab === "settings")}">Settings</button>
          <button type="button" class="pkh-tab" data-tab="debug" data-active="${String(initialTab === "debug")}">Debug</button>
        </div>
        <div class="pkh-panel" data-panel="status" data-active="${String(initialTab === "status")}">
          <div class="pkh-buttons">
            <button type="button" data-action="start" data-kind="start">Start</button>
            <button type="button" data-action="pause">Pause</button>
            <button type="button" data-action="stop" data-kind="stop">Stop</button>
          </div>
          <div class="pkh-grid">
            <div class="pkh-label">Attempts</div><div class="pkh-value" data-field="attempts">0</div>
            <div class="pkh-label">State</div><div class="pkh-value" data-field="state">IDLE</div>
            <div class="pkh-label">Screen</div><div class="pkh-value" data-field="screen">unknown</div>
            <div class="pkh-label">Region</div><div class="pkh-value" data-field="region">Kanto</div>
            <div class="pkh-label">Target</div><div class="pkh-value" data-field="target">Shiny Charmander</div>
            <div class="pkh-label">Starter</div><div class="pkh-value" data-field="starter">Magnemite</div>
          </div>
          <div class="pkh-log" data-field="log"></div>
        </div>
        <div class="pkh-panel" data-panel="hunt" data-active="${String(initialTab === "hunt")}">
          <div class="pkh-row">
            <label>Region <select data-setting="region">
              ${REGIONS.map((region) => `<option value="${escapeHtml(region.key)}">${escapeHtml(region.label)}</option>`).join("")}
            </select></label>
          </div>
          <div class="pkh-picker-grid">
            ${renderPokemonPicker("targetPokemon", "Target", "Charmander")}
            ${renderPokemonPicker("starterPokemon", "Starter", "Magnemite")}
          </div>
          <div class="pkh-buttons pkh-hunt-actions">
            <button type="button" data-action="savehunt">Save</button>
          </div>
        </div>
        <div class="pkh-panel" data-panel="settings" data-active="${String(initialTab === "settings")}">
          <div class="pkh-row">
            <label>Min delay <input type="number" min="0" step="50" data-setting="minDelayMs"></label>
            <label>Max delay <input type="number" min="0" step="50" data-setting="maxDelayMs"></label>
          </div>
          <div class="pkh-row">
            <label>Stop after N attempts <input type="number" min="0" step="1" data-setting="stopAfterAttempts"></label>
          </div>
          <label><input type="checkbox" data-setting="autoCatch"> Catch shiny target automatically</label>
          <label><input type="checkbox" data-setting="useChoiceRerolls"> Use one reroll per Pokemon slot</label>
          <label><input type="checkbox" data-setting="stopOnAnyShiny"> Stop on any shiny</label>
          <label><input type="checkbox" data-setting="dryRun"> Dry run mode</label>
          <label><input type="checkbox" data-setting="autoResume"> Auto resume after reload</label>
          <div class="pkh-grid">
            <div class="pkh-label">Update</div><div class="pkh-value" data-field="update">Not checked.</div>
          </div>
          <div class="pkh-buttons">
            <button type="button" data-action="checkupdate">Check for update</button>
            <button type="button" data-action="openupdate" data-update-button hidden>Open update page</button>
          </div>
        </div>
        <div class="pkh-panel" data-panel="debug" data-active="${String(initialTab === "debug")}">
          <div class="pkh-grid">
            <div class="pkh-label">Last error</div><div class="pkh-value" data-field="error">none</div>
          </div>
          <div class="pkh-buttons">
            <button type="button" data-action="copylog">Copy log</button>
          </div>
          <div class="pkh-label">Escape stops immediately. Insert toggles this panel.</div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    applyOverlayLayout();

    overlayFields = {
      attempts: overlay.querySelector("[data-field='attempts']"),
      state: overlay.querySelector("[data-field='state']"),
      screen: overlay.querySelector("[data-field='screen']"),
      region: overlay.querySelector("[data-field='region']"),
      error: overlay.querySelector("[data-field='error']"),
      target: overlay.querySelector("[data-field='target']"),
      starter: overlay.querySelector("[data-field='starter']"),
      update: overlay.querySelector("[data-field='update']"),
      updateButton: overlay.querySelector("[data-update-button]"),
      log: overlay.querySelector("[data-field='log']"),
      found: overlay.querySelector("[data-field='found']")
    };

    overlay.addEventListener("click", (event) => {
      if (Date.now() < suppressOverlayClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const tab = event.target.closest("[data-tab]");
      if (tab) {
        selectOverlayTab(tab.dataset.tab);
        return;
      }

      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      if (action === "start") startBot();
      if (action === "pause") togglePause();
      if (action === "stop") stopBot("Stopped by overlay button.", STATES.STOPPED);
      if (action === "hide") toggleOverlayVisibility();
      if (action === "show") toggleOverlayVisibility(false);
      if (action === "savehunt") applyHuntInputsFromOverlay();
      if (action === "checkupdate") checkForUpdate();
      if (action === "openupdate") openUpdatePage();
      if (action === "copylog") copyDebugLog();
    });

    overlay.querySelectorAll("[data-setting]").forEach((input) => {
      const name = input.dataset.setting;
      if (input.type === "checkbox") {
        input.checked = Boolean(settings[name]);
      } else {
        input.value = settings[name];
      }
      input.addEventListener("change", () => {
        const previousTarget = settings.targetPokemon;
        if (input.type === "checkbox") {
          settings[name] = input.checked;
        } else if (input.tagName === "SELECT") {
          settings[name] = input.value;
          if (name === "region") {
            settings.region = normalizeRegionKey(settings.region);
            resetInvalidPokemonSelectionsForRegion();
            closePokemonMenus();
          }
        } else if (input.type === "text") {
          settings[name] = sanitizePokemonName(input.value);
          input.value = settings[name];
        } else {
          settings[name] = Number(input.value);
        }
        if (normalizeForCompare(previousTarget) !== normalizeForCompare(settings.targetPokemon)) {
          resetAttemptsForNewTarget();
        }
        persistSettings();
        updateOpenPokemonMenus();
      });
    });

    setupPokemonPickers();
    setupOverlayDragging();
    setupOverlayResizePersistence();
    updateOverlay();
  }

  function selectOverlayTab(tabName) {
    if (!overlay) return;
    const normalizedTab = normalizeOverlayTab(tabName);
    if (!runtime.overlayHidden) persistPanelLayout(activeOverlayTab);
    activeOverlayTab = normalizedTab;
    writeStorage("activeTab", activeOverlayTab);
    overlay.querySelectorAll("[data-tab]").forEach((tab) => {
      tab.dataset.active = String(tab.dataset.tab === activeOverlayTab);
    });
    overlay.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.dataset.active = String(panel.dataset.panel === activeOverlayTab);
    });
    closePokemonMenus();
    if (!runtime.overlayHidden) applyOverlayLayout();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderPokemonPicker(settingName, label, placeholder) {
    const id = `pkh-${settingName}`;
    return `
      <div class="pkh-picker" data-picker="${escapeHtml(settingName)}">
        <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
        <div class="pkh-picker-control" data-picker-selected data-empty="true">
          <img class="pkh-pokemon-sprite" data-picker-selected-sprite alt="" loading="lazy" hidden>
          <span class="pkh-picker-name-wrap">
            <input id="${escapeHtml(id)}" type="text" maxlength="32" autocomplete="off" data-setting="${escapeHtml(settingName)}" data-picker-input placeholder="${escapeHtml(placeholder)}">
          </span>
          <span class="pkh-type-list" data-picker-selected-types></span>
        </div>
        <div class="pkh-picker-menu" data-picker-menu role="listbox"></div>
      </div>
    `;
  }

  function showPokemonInPickerPreview(picker, pokemon) {
    const preview = picker.querySelector("[data-picker-selected]");
    const sprite = picker.querySelector("[data-picker-selected-sprite]");
    const types = picker.querySelector("[data-picker-selected-types]");
    if (!preview) return;
    const selectedName = pokemon ? pokemon.name : "";
    if (preview.dataset.pokemon === selectedName) return;
    preview.dataset.empty = String(!pokemon);
    if (sprite) {
      sprite.hidden = !pokemon;
      if (pokemon) sprite.src = pokemonSpriteUrl(pokemon);
    }
    if (types) types.innerHTML = pokemon ? renderTypeBadges(pokemon.types) : "";
    preview.dataset.pokemon = selectedName;
  }

  function updatePickerPreviewFromSetting(picker) {
    const settingName = picker.dataset.picker;
    if (!settingName) return;
    showPokemonInPickerPreview(picker, findPokemonOption(settings[settingName], settings.region));
  }

  function updateSelectedPokemonPreviews(force = false) {
    if (!overlay) return;
    overlay.querySelectorAll("[data-picker]").forEach((picker) => {
      const menu = picker.querySelector("[data-picker-menu]");
      if (!force && menu && menu.dataset.open === "true") return;
      updatePickerPreviewFromSetting(picker);
    });
  }

  function renderPokemonOption(pokemon) {
    const title = `${pokemon.name} - ${pokemon.types.join("/")}`;
    return `
      <button type="button" class="pkh-picker-option" data-picker-option="${escapeHtml(pokemon.name)}" title="${escapeHtml(title)}" role="option">
        <img class="pkh-pokemon-sprite" src="${escapeHtml(pokemonSpriteUrl(pokemon))}" alt="" loading="lazy">
        <span class="pkh-pokemon-name">${escapeHtml(pokemon.name)}</span>
        <span class="pkh-type-list">${renderTypeBadges(pokemon.types)}</span>
      </button>
    `;
  }

  function filterPokemonOptions(query) {
    const normalized = normalizeForCompare(query);
    const options = getRegionPokemon(settings.region);
    if (!normalized) return options;
    return options
      .filter((pokemon) => normalizeForCompare(pokemon.name).includes(normalized));
  }

  function renderPokemonMenu(picker) {
    const input = picker.querySelector("[data-picker-input]");
    const menu = picker.querySelector("[data-picker-menu]");
    if (!input || !menu) return;
    showPokemonInPickerPreview(picker, null);

    const options = filterPokemonOptions(input.value);
    menu.innerHTML = options.length
      ? options.map(renderPokemonOption).join("")
      : `<div class="pkh-picker-empty">No Pokemon in ${escapeHtml(selectedRegion().label)} matches this filter.</div>`;
    menu.dataset.open = "true";
    if (options.length) setActivePokemonOption(picker, 0);
  }

  function getPickerOptions(picker) {
    return Array.from(picker.querySelectorAll("[data-picker-option]"));
  }

  function activePokemonOptionIndex(picker) {
    return getPickerOptions(picker).findIndex((option) => option.dataset.active === "true");
  }

  function setActivePokemonOption(picker, index) {
    const options = getPickerOptions(picker);
    if (!options.length) return;
    const boundedIndex = clampNumber(index, 0, options.length - 1);
    options.forEach((option, optionIndex) => {
      const active = optionIndex === boundedIndex;
      option.dataset.active = String(active);
      option.setAttribute("aria-selected", String(active));
    });
    options[boundedIndex].scrollIntoView({ block: "nearest" });
  }

  function moveActivePokemonOption(picker, delta) {
    const options = getPickerOptions(picker);
    if (!options.length) return;
    const currentIndex = activePokemonOptionIndex(picker);
    const nextIndex = currentIndex < 0 ? 0 : currentIndex + delta;
    setActivePokemonOption(picker, (nextIndex + options.length) % options.length);
  }

  function selectPokemonOption(option) {
    if (!option || !overlay || !overlay.contains(option)) return;
    const picker = option.closest("[data-picker]");
    const input = picker ? picker.querySelector("[data-picker-input]") : null;
    if (!input) return;
    const previousTarget = settings.targetPokemon;
    input.value = option.dataset.pickerOption || "";
    settings[input.dataset.setting] = sanitizePokemonName(input.value);
    if (input.dataset.setting === "targetPokemon" && normalizeForCompare(previousTarget) !== normalizeForCompare(settings.targetPokemon)) {
      resetAttemptsForNewTarget();
    }
    persistSettings();
    closePokemonMenus();
  }

  function closePokemonMenus() {
    if (!overlay) return;
    overlay.querySelectorAll("[data-picker-menu]").forEach((menu) => {
      menu.dataset.open = "false";
    });
    updateSelectedPokemonPreviews(true);
  }

  function updateOpenPokemonMenus() {
    if (!overlay) return;
    overlay.querySelectorAll("[data-picker]").forEach((picker) => {
      const menu = picker.querySelector("[data-picker-menu]");
      if (menu && menu.dataset.open === "true") renderPokemonMenu(picker);
    });
  }

  function resetInvalidPokemonSelectionsForRegion() {
    if (!findPokemonOption(settings.targetPokemon, settings.region)) {
      settings.targetPokemon = defaultPokemonForRegion(settings.region, "targetPokemon");
    }
    if (!findPokemonOption(settings.starterPokemon, settings.region)) {
      settings.starterPokemon = defaultPokemonForRegion(settings.region, "starterPokemon");
    }
  }

  function applyHuntInputsFromOverlay() {
    if (!overlay) return;
    const previousTarget = settings.targetPokemon;
    const regionInput = overlay.querySelector("[data-setting='region']");
    const targetInput = overlay.querySelector("[data-setting='targetPokemon']");
    const starterInput = overlay.querySelector("[data-setting='starterPokemon']");

    if (regionInput) settings.region = normalizeRegionKey(regionInput.value);
    if (targetInput) settings.targetPokemon = sanitizePokemonName(targetInput.value) || defaultPokemonForRegion(settings.region, "targetPokemon");
    if (starterInput) settings.starterPokemon = sanitizePokemonName(starterInput.value) || defaultPokemonForRegion(settings.region, "starterPokemon");
    resetInvalidPokemonSelectionsForRegion();

    if (normalizeForCompare(previousTarget) !== normalizeForCompare(settings.targetPokemon)) {
      resetAttemptsForNewTarget();
    }
    persistSettings();
    closePokemonMenus();
    updateOverlay();
  }

  function setupPokemonPickers() {
    overlay.querySelectorAll("[data-picker]").forEach((picker) => {
      const input = picker.querySelector("[data-picker-input]");
      if (!input) return;
      input.addEventListener("focus", () => renderPokemonMenu(picker));
      input.addEventListener("input", () => renderPokemonMenu(picker));
      input.addEventListener("keydown", (event) => {
        const menu = picker.querySelector("[data-picker-menu]");
        const menuOpen = menu && menu.dataset.open === "true";
        if (event.key === "ArrowDown") {
          if (!menuOpen) {
            renderPokemonMenu(picker);
            setActivePokemonOption(picker, 0);
          }
          else moveActivePokemonOption(picker, 1);
          event.preventDefault();
        } else if (event.key === "ArrowUp") {
          if (!menuOpen) {
            renderPokemonMenu(picker);
            setActivePokemonOption(picker, 0);
          }
          else moveActivePokemonOption(picker, -1);
          event.preventDefault();
        } else if (event.key === "Enter" && menuOpen) {
          const options = getPickerOptions(picker);
          const activeIndex = activePokemonOptionIndex(picker);
          selectPokemonOption(options[activeIndex >= 0 ? activeIndex : 0]);
          event.preventDefault();
        } else if (event.key === "Escape") {
          closePokemonMenus();
          event.preventDefault();
        }
      });
    });

    overlay.addEventListener("mousedown", (event) => {
      const option = event.target.closest("[data-picker-option]");
      if (!option || !overlay.contains(option)) return;
      event.preventDefault();
      selectPokemonOption(option);
    });

    overlay.addEventListener("mouseover", (event) => {
      const option = event.target.closest("[data-picker-option]");
      if (!option || !overlay.contains(option)) return;
      const picker = option.closest("[data-picker]");
      const options = picker ? getPickerOptions(picker) : [];
      const optionIndex = options.indexOf(option);
      if (picker && optionIndex >= 0) setActivePokemonOption(picker, optionIndex);
    });

    overlay.addEventListener("error", (event) => {
      if (event.target && event.target.matches && event.target.matches(".pkh-pokemon-sprite")) {
        event.target.hidden = true;
      }
    }, true);

    document.addEventListener("mousedown", (event) => {
      if (!overlay || overlay.contains(event.target)) return;
      closePokemonMenus();
    });
  }

  function updateOverlay() {
    if (!overlay) return;
    overlay.dataset.hidden = String(runtime.overlayHidden);
    runtime.lastScreen = detectCurrentScreen();
    if (overlayFields.attempts) overlayFields.attempts.textContent = String(runtime.attempts);
    if (overlayFields.state) overlayFields.state.textContent = runtime.paused ? `${runtime.state} (paused)` : runtime.state;
    if (overlayFields.screen) overlayFields.screen.textContent = runtime.lastScreen || "unknown";
    if (overlayFields.region) overlayFields.region.textContent = selectedRegion().label;
    if (overlayFields.error) overlayFields.error.textContent = runtime.lastError || "none";
    if (overlayFields.target) overlayFields.target.textContent = `Shiny ${settings.targetPokemon}`;
    if (overlayFields.starter) overlayFields.starter.textContent = settings.starterPokemon;
    if (overlayFields.update) overlayFields.update.textContent = runtime.updateMessage;
    if (overlayFields.updateButton) overlayFields.updateButton.hidden = !runtime.updateAvailable;
    if (overlayFields.log) overlayFields.log.textContent = runtime.logs.slice(-12).join("\n");
    if (overlayFields.found) overlayFields.found.dataset.show = String(runtime.state === STATES.FOUND);
    if (overlayFields.found) overlayFields.found.textContent = runtime.foundMessage || `Shiny ${settings.targetPokemon} found!`;
    updateSelectedPokemonPreviews();

    if (overlay) {
      overlay.querySelectorAll("[data-setting]").forEach((input) => {
        const name = input.dataset.setting;
        if (!(name in settings)) return;
        const picker = input.closest("[data-picker]");
        const menu = picker ? picker.querySelector("[data-picker-menu]") : null;
        if (document.activeElement === input || (menu && menu.dataset.open === "true")) return;
        if (input.type === "checkbox") input.checked = Boolean(settings[name]);
        else input.value = settings[name];
      });
    }
  }

  function toggleOverlayVisibility(forceHidden) {
    persistCurrentOverlayLayout();
    runtime.overlayHidden = typeof forceHidden === "boolean" ? forceHidden : !runtime.overlayHidden;
    writeStorage("overlayHidden", runtime.overlayHidden);
    applyOverlayLayout();
    updateOverlay();
  }

  // ---------------------------------------------------------------------------
  // Core utilities
  // ---------------------------------------------------------------------------

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function randomSleep(min, max) {
    const low = Math.max(0, Number(min) || 0);
    const high = Math.max(low, Number(max) || low);
    const delay = Math.floor(low + Math.random() * (high - low + 1));
    await sleep(delay);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeForCompare(value) {
    return normalizeText(value).toLowerCase();
  }

  function parseVersionParts(version) {
    return String(version || "")
      .split(".")
      .map((part) => Number(part.replace(/\D.*/, "")) || 0);
  }

  function compareVersions(left, right) {
    const a = parseVersionParts(left);
    const b = parseVersionParts(right);
    const length = Math.max(a.length, b.length, 3);
    for (let index = 0; index < length; index += 1) {
      const diff = (a[index] || 0) - (b[index] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  function extractUserscriptVersion(text) {
    const match = String(text || "").match(/^\s*\/\/\s*@version\s+([^\s]+)/m);
    return match ? match[1] : "";
  }

  async function checkForUpdate() {
    if (runtime.updateChecking) return;
    runtime.updateChecking = true;
    runtime.updateMessage = "Checking...";
    runtime.updateAvailable = false;
    updateOverlay();
    try {
      const response = await fetch(`${UPDATE_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const latestVersion = extractUserscriptVersion(await response.text());
      if (!latestVersion) throw new Error("Could not find @version.");
      runtime.updateLatestVersion = latestVersion;
      runtime.updateAvailable = compareVersions(latestVersion, SCRIPT_VERSION) > 0;
      runtime.updateMessage = runtime.updateAvailable
        ? `New version available: v${latestVersion}`
        : `You are up to date: v${SCRIPT_VERSION}`;
    } catch (error) {
      runtime.updateMessage = `Update check failed: ${error.message || error}`;
      runtime.updateAvailable = false;
    } finally {
      runtime.updateChecking = false;
      updateOverlay();
    }
  }

  function openUpdatePage() {
    window.open(UPDATE_URL, "_blank", "noopener,noreferrer");
  }

  function getElementText(el) {
    if (!el) return "";
    const aria = el.getAttribute && (el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("alt"));
    const text = "innerText" in el ? el.innerText : el.textContent;
    return normalizeText(text || aria || "");
  }

  function textEquals(el, text) {
    return normalizeForCompare(getElementText(el)) === normalizeForCompare(text);
  }

  function queryAll(selector, scope = document) {
    try {
      return Array.from(scope.querySelectorAll(selector));
    } catch (error) {
      log(`Bad selector skipped: ${selector}`);
      return [];
    }
  }

  function isOverlayElement(el) {
    return Boolean(el && el.closest && el.closest(`#${OVERLAY_ID}`));
  }

  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    if (isOverlayElement(el)) return false;
    const style = window.getComputedStyle(el);
    if (!style || style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }
    if (el.classList && el.classList.contains("screen") && !el.classList.contains("active")) return false;
    if (!hasUsableBox(el)) return false;
    return true;
  }

  function hasUsableBox(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 1 && rect.height > 1) return true;
    if (typeof el.getBBox === "function") {
      try {
        const box = el.getBBox();
        return box && box.width > 1 && box.height > 1;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  function getElementCenter(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 1 && rect.height > 1) {
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    return {
      x: Math.max(0, Math.min(window.innerWidth - 1, window.innerWidth / 2)),
      y: Math.max(0, Math.min(window.innerHeight - 1, window.innerHeight / 2))
    };
  }

  function uniqueElements(elements) {
    return Array.from(new Set(elements.filter(Boolean)));
  }

  function sortByScreenPosition(elements) {
    return elements.slice().sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return (ar.top - br.top) || (ar.left - br.left);
    });
  }

  function findButtonByText(texts) {
    const targets = (Array.isArray(texts) ? texts : [texts]).map(normalizeForCompare);
    const selector = [
      "button",
      "a",
      "div[role='button']",
      "[role='button']",
      "[class*='button']",
      "[class*='btn']",
      "input[type='button']",
      "input[type='submit']"
    ].join(",");
    const candidates = queryAll(selector).filter(isVisible);
    const scored = [];

    for (const el of candidates) {
      const text = normalizeForCompare(getElementText(el));
      const aria = normalizeForCompare(el.getAttribute("aria-label") || el.getAttribute("title") || el.value || "");
      for (const target of targets) {
        if (!target) continue;
        if (text === target || aria === target) {
          scored.push({ el, score: 0 });
          break;
        }
        if (text.includes(target) || aria.includes(target)) {
          scored.push({ el, score: 1 });
          break;
        }
      }
    }

    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const ar = a.el.getBoundingClientRect();
      const br = b.el.getBoundingClientRect();
      return (ar.top - br.top) || (ar.left - br.left);
    });

    return scored[0] ? scored[0].el : null;
  }

  function findActionByText(texts, extraSelectors = []) {
    const base = [
      "button",
      "a",
      "[role='button']",
      "[tabindex]",
      "[onclick]",
      ".title-mode-card",
      ".title-mode-resume",
      ".history-region-btn",
      ".poke-card",
      ".dex-card"
    ];
    const candidates = queryAll(base.concat(extraSelectors).join(",")).filter(isVisible);
    const targets = (Array.isArray(texts) ? texts : [texts]).map(normalizeForCompare);
    const scored = [];

    for (const el of candidates) {
      const text = normalizeForCompare(getElementText(el));
      for (const target of targets) {
        if (!target) continue;
        if (text === target) {
          scored.push({ el, score: 0 });
          break;
        }
        if (text.includes(target)) {
          scored.push({ el, score: 1 });
          break;
        }
      }
    }

    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const ar = a.el.getBoundingClientRect();
      const br = b.el.getBoundingClientRect();
      return (ar.top - br.top) || (ar.left - br.left);
    });

    return scored[0] ? scored[0].el : null;
  }

  function safeClick(el, label) {
    if (!el) {
      log(`Click skipped, missing element: ${label}`);
      return false;
    }
    if (!isVisible(el)) {
      log(`Click skipped, hidden element: ${label}`);
      return false;
    }

    if (settings.dryRun) {
      log(`[dry run] Would click ${label}: ${describeElement(el)}`);
      return true;
    }

    try {
      el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    } catch (error) {
      try {
        el.scrollIntoView();
      } catch (innerError) {
        // Non-critical; continue with event dispatch.
      }
    }

    const center = getElementCenter(el);
    const eventOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: center.x,
      clientY: center.y,
      screenX: window.screenX + center.x,
      screenY: window.screenY + center.y,
      button: 0,
      buttons: 1
    };
    if (typeof PointerEvent === "function") {
      ["pointerdown", "pointerup"].forEach((type) => {
        el.dispatchEvent(new PointerEvent(type, { ...eventOptions, pointerId: 1, pointerType: "mouse", isPrimary: true }));
      });
    }
    ["mousedown", "mouseup", "click"].forEach((type) => {
      el.dispatchEvent(new MouseEvent(type, eventOptions));
    });
    if (typeof el.click === "function") {
      el.click();
    }
    log(`Clicked ${label}: ${describeElement(el)}`);
    return true;
  }

  function pressKey(key, code) {
    if (settings.dryRun) {
      log(`[dry run] Would press ${key} (${code})`);
      return true;
    }

    const keyCode = code === "KeyR" ? 82 : key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0;
    const options = {
      key,
      code,
      keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true
    };
    document.dispatchEvent(new KeyboardEvent("keydown", options));
    document.dispatchEvent(new KeyboardEvent("keyup", options));
    log(`Pressed ${key} (${code})`);
    return true;
  }

  async function waitForCondition(fn, timeoutMs, pollMs, label) {
    const start = Date.now();
    let lastError = null;
    while (Date.now() - start <= timeoutMs) {
      if (!runtime.running && runtime.state !== STATES.FOUND) return null;
      try {
        const result = fn();
        if (result) return result;
      } catch (error) {
        lastError = error;
      }
      await sleep(pollMs);
    }
    if (lastError) log(`Wait ${label} last error: ${lastError.message || lastError}`);
    log(`Wait timed out: ${label}`);
    return null;
  }

  function describeElement(el) {
    if (!el) return "null";
    const id = el.id ? `#${el.id}` : "";
    const cls = el.className && typeof el.className === "string"
      ? `.${el.className.trim().replace(/\s+/g, ".")}`
      : "";
    const text = getElementText(el);
    return `${el.tagName.toLowerCase()}${id}${cls}${text ? ` "${text.slice(0, 80)}"` : ""}`;
  }

  // ---------------------------------------------------------------------------
  // Pokemon and shiny detection
  // ---------------------------------------------------------------------------

  function getAllPokemonCards(scope = document) {
    const cards = [];

    for (const selector of SELECTORS.pokemonCards) {
      cards.push(...queryAll(selector, scope));
    }

    for (const nameEl of queryAll(SELECTORS.pokemonName, scope)) {
      const card = nameEl.closest(".poke-card, .poke-choice-wrap, .starter-card, .starter-option, .pc-box .dex-card, .dex-card, [role='button'], [tabindex], [class*='card']");
      cards.push(card || nameEl.parentElement);
    }

    return uniqueElements(cards).filter((el) => el instanceof Element && isVisible(el));
  }

  function cleanPokemonName(raw) {
    if (!raw) return null;
    const lines = String(raw)
      .split(/\r?\n| {2,}/)
      .map((line) => normalizeText(line))
      .filter(Boolean);
    const excluded = /^(hp|atk|def|sp\.?atk|sp\.?def|speed|type|ability|choose|skip|flee|team|items|badges|passive|caught|level|lvl)$/i;

    for (const line of lines.length ? lines : [normalizeText(raw)]) {
      let candidate = line
        .replace(/^[*+\-\s]+/, "")
        .replace(/\b(shiny|caught|new)\b/gi, " ")
        .replace(/\b(lv|lvl|level)\.?\s*\d+.*$/i, "")
        .replace(/\s+#?\d+.*$/i, "")
        .replace(/[^A-Za-z0-9 .'_-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!candidate || excluded.test(candidate)) continue;
      if (candidate.length > 32) continue;
      if (!/[A-Za-z]/.test(candidate)) continue;
      return candidate;
    }

    return null;
  }

  function getPokemonName(card) {
    if (!card) return null;
    const preferred = card.querySelector(SELECTORS.pokemonName);
    if (preferred && isVisible(preferred)) {
      const name = cleanPokemonName(preferred.innerText || preferred.textContent);
      if (name) return name;
    }

    const fallbackText = card.innerText || card.textContent || "";
    return cleanPokemonName(fallbackText);
  }

  function isCardShiny(card) {
    if (!card) return false;

    for (const selector of SELECTORS.shiny) {
      const marker = card.matches(selector) ? card : card.querySelector(selector);
      if (marker && marker instanceof Element && isVisible(marker)) return true;
    }

    let current = card;
    for (let depth = 0; current && current instanceof Element && depth < 4; depth += 1) {
      const className = typeof current.className === "string" ? current.className : "";
      if (/\bshiny\b|shiny-/i.test(className)) return true;
      current = current.parentElement;
    }

    const images = queryAll("img, image", card);
    for (const img of images) {
      const src = img.getAttribute("src") || img.getAttribute("href") || img.getAttribute("xlink:href") || "";
      if (/\/shiny\/|shiny/i.test(src)) return true;
    }

    return false;
  }

  function findPokemonCard(name, shinyOnly) {
    return findPokemonCardInCards(getAllPokemonCards(), name, shinyOnly);
  }

  function findPokemonCardInCards(cards, name, shinyOnly) {
    const wanted = normalizeForCompare(name);
    for (const card of cards) {
      const cardName = getPokemonName(card);
      if (normalizeForCompare(cardName) !== wanted) continue;
      if (shinyOnly && !isCardShiny(card)) continue;
      return card;
    }
    return null;
  }

  function findAnyShinyCard(cards) {
    return cards.find(isCardShiny) || null;
  }

  function getVisibleChoiceCards() {
    const catchChoices = document.querySelector("#catch-choices");
    if (catchChoices && isVisible(catchChoices)) {
      return getAllPokemonCards(catchChoices).filter((card) => !card.closest("#catch-team-bar"));
    }
    const catchScreen = document.querySelector("#catch-screen");
    if (catchScreen && isVisible(catchScreen)) {
      return getAllPokemonCards(catchScreen).filter((card) => !card.closest("#catch-team-bar"));
    }
    return getAllPokemonCards();
  }

  function getClickableCardElement(card) {
    if (!card) return null;
    if (isVisible(card) && (card.matches("[role='button'], [tabindex], button, .poke-card, .dex-card") || card.onclick)) {
      return card;
    }
    const child = queryAll("[role='button'], [tabindex], button, .poke-card, .dex-card", card).find(isVisible);
    return child || card;
  }

  function getChoiceArea() {
    const catchChoices = document.querySelector("#catch-choices");
    if (catchChoices && isVisible(catchChoices)) return catchChoices;
    const catchScreen = document.querySelector("#catch-screen");
    if (catchScreen && isVisible(catchScreen)) return catchScreen;
    return document;
  }

  function isRerollText(value) {
    return /\bre\s*-?\s*roll\b|\breroll\b/i.test(String(value || ""));
  }

  function isDisabledRerollControl(el) {
    if (!el) return true;
    const className = typeof el.className === "string" ? el.className : "";
    return Boolean(
      el.disabled
      || el.getAttribute("disabled") !== null
      || el.getAttribute("aria-disabled") === "true"
      || /\b(disabled|used|spent|inactive)\b/i.test(className)
    );
  }

  function isRerollControl(el) {
    if (!el || isOverlayElement(el) || el.closest("#catch-team-bar") || isDisabledRerollControl(el)) return false;

    const strongHint = [
      el.id,
      typeof el.className === "string" ? el.className : "",
      el.getAttribute("aria-label"),
      el.getAttribute("title"),
      el.getAttribute("value")
    ].some(isRerollText);
    const textHint = isRerollText(getElementText(el));

    if (!strongHint && !textHint) return false;
    if (/reset run|new run|play again|main menu/i.test(getElementText(el))) return false;
    if (el.matches(".poke-card, .poke-choice-wrap, .dex-card, [class*='card']") && !strongHint) return false;

    return true;
  }

  function getChoiceRerollControls() {
    const root = getChoiceArea();
    const selector = [
      "button",
      "a",
      "[role='button']",
      "[tabindex]",
      "input[type='button']",
      "input[type='submit']",
      "[class*='reroll']",
      "[class*='re-roll']",
      "[id*='reroll']",
      "[id*='re-roll']",
      "[aria-label]",
      "[title]"
    ].join(",");

    const controls = queryAll(selector, root)
      .filter((el) => el instanceof Element && isVisible(el) && isRerollControl(el));

    return sortByScreenPosition(uniqueElements(controls)).slice(0, 3);
  }

  function getChoiceSignature() {
    return getVisibleChoiceCards()
      .map((card) => `${getPokemonName(card) || "unknown"}:${isCardShiny(card) ? "shiny" : "normal"}`)
      .join("|");
  }

  function getRerollControlDebugRows() {
    return getChoiceRerollControls().map((el) => ({
      disabled: isDisabledRerollControl(el),
      text: getElementText(el),
      element: describeElement(el)
    }));
  }

  async function useChoiceRerollsOnce() {
    if (!settings.useChoiceRerolls) return 0;

    const controls = getChoiceRerollControls();
    if (!controls.length) {
      log("No Pokemon slot reroll controls found.");
      return 0;
    }

    let used = 0;
    for (const control of controls) {
      if (!runtime.running || runtime.paused) break;
      if (!isVisible(control) || isDisabledRerollControl(control)) continue;
      const before = getChoiceSignature();
      if (!safeClick(control, `Pokemon slot reroll ${used + 1}`)) continue;
      used += 1;
      await sleep(500);
      const after = getChoiceSignature();
      if (after && after !== before) {
        log(`Pokemon slot reroll ${used} updated choices.`);
      }
    }

    if (used > 0) {
      await waitForCondition(() => {
        if (detectCurrentScreen() !== "catch-screen") return null;
        const cards = getVisibleChoiceCards();
        return cards.some((card) => getPokemonName(card)) ? cards : null;
      }, 3000, 150, "Pokemon choices after slot rerolls");
    }

    return used;
  }

  function getCardDebugRows(cards = getAllPokemonCards()) {
    return cards.map((card) => ({
      name: getPokemonName(card),
      shiny: isCardShiny(card),
      element: card
    }));
  }

  function logChoiceCards() {
    const rows = getCardDebugRows(getVisibleChoiceCards());
    log(`[dry run] Pokemon cards: ${rows.map((row) => `${row.name || "unknown"}:${row.shiny ? "shiny" : "normal"}`).join(", ") || "none"}`);
    console.table(rows.map((row) => ({ name: row.name, shiny: row.shiny, element: describeElement(row.element) })));
  }

  // ---------------------------------------------------------------------------
  // Pokelike screen and route helpers
  // ---------------------------------------------------------------------------

  function screenVisible(id) {
    const el = document.getElementById(id);
    return Boolean(el && isVisible(el));
  }

  function activeScreenId() {
    const active = queryAll(".screen.active").find(isVisible);
    if (active) return active.id || "";
    const visibleScreens = queryAll(".screen").filter(isVisible);
    return visibleScreens[0] ? visibleScreens[0].id || "" : "";
  }

  function bodyText() {
    return normalizeText(document.body ? document.body.innerText || document.body.textContent : "");
  }

  function detectCurrentScreen() {
    if (document.documentElement.classList.contains("poke-maint-on")) return "maintenance";

    const active = activeScreenId();
    if (active) return active;

    const text = bodyText();
    if (/Wild Pokemon Appeared/i.test(text) || (document.querySelector("#catch-choices") && isVisible(document.querySelector("#catch-choices")))) return "catch-screen";
    if (/Choose Your Starter/i.test(text) || screenVisible("starter-screen")) return "starter-screen";
    if (/Battle Tower/i.test(text) && document.querySelector("#stage-select-list")) return "endless-stage-select";
    if (/GAME OVER/i.test(text)) return "gameover-screen";
    if (/Wild Battle/i.test(text)) return "battle-screen";
    if (/Pokemon Roguelike/i.test(text) && /Battle Tower/i.test(text)) return "title-screen";
    if (document.querySelector("#map-container svg") && isVisible(document.querySelector("#map-container"))) return "map-screen";
    return "unknown";
  }

  function stateForCurrentScreen() {
    const screen = detectCurrentScreen();
    runtime.lastScreen = screen;

    if (screen === "title-screen") return STATES.ENTER_BATTLE_TOWER;
    if (screen === "history-region-select") return STATES.ENTER_BATTLE_TOWER;
    if (screen === "endless-stage-select") return STATES.SELECT_REGION;
    if (screen === "starter-screen") return STATES.SELECT_STARTER;
    if (screen === "map-screen") return STATES.OPEN_FIRST_CATCH_NODE;
    if (screen === "catch-screen") return STATES.WAIT_FOR_POKEMON_CHOICES;
    if (screen === "gameover-screen" || screen === "win-screen" || screen === "endless-stage-complete") return STATES.RESET_RUN;
    if (screen === "battle-screen" || screen === "item-screen" || screen === "passive-screen" || screen === "swap-screen" || screen === "trade-screen" || screen === "elite-prep-screen") {
      return STATES.RESET_RUN;
    }
    return STATES.ENTER_BATTLE_TOWER;
  }

  function findStageButton(stageName) {
    const locked = [];
    const candidates = queryAll("#stage-select-list .history-region-btn, .history-region-btn, #stage-select-list [role='button'], #stage-select-list button").filter(isVisible);
    for (const el of candidates) {
      const nameEl = el.querySelector(".history-region-name") || el;
      if (!textEquals(nameEl, stageName) && !normalizeForCompare(getElementText(nameEl)).includes(normalizeForCompare(stageName))) continue;
      if (el.classList.contains("history-region-btn--locked") || /locked/i.test(getElementText(el))) {
        locked.push(el);
        continue;
      }
      return el;
    }

    if (locked.length) return { locked: true, element: locked[0] };
    return findActionByText([stageName], ["#stage-select-list *"]);
  }

  function findCatchRouteIcon() {
    const candidates = [];
    for (const selector of SELECTORS.catchIcons) {
      const matches = queryAll(selector);
      candidates.push(...matches);
      const match = matches.find(isVisible);
      if (match) return preferredClickableAncestor(match);
    }

    const svgImages = queryAll("#map-container svg image, svg image").filter((el) => {
      const href = el.getAttribute("href") || el.getAttribute("xlink:href") || "";
      const matched = /catchPokemon/i.test(href);
      if (matched) candidates.push(el);
      return matched && isVisible(el);
    });
    if (svgImages.length) return preferredClickableAncestor(svgImages[0]);

    const htmlImages = queryAll("#map-container img, img").filter((el) => {
      const src = el.getAttribute("src") || "";
      const matched = /catchPokemon/i.test(src);
      if (matched) candidates.push(el);
      return matched && isVisible(el);
    });
    if (htmlImages.length) return preferredClickableAncestor(htmlImages[0]);

    const mapNodes = queryAll("#map-container svg g.map-node--clickable, #map-container svg g.map-node").filter((node) => {
      const image = node.querySelector("image, img");
      const href = image ? image.getAttribute("href") || image.getAttribute("xlink:href") || image.getAttribute("src") || "" : "";
      const matched = /catchPokemon/i.test(href);
      if (matched) candidates.push(node);
      return matched && isVisible(node);
    });
    if (mapNodes[0]) return mapNodes[0];

    const pokeballNodes = getMapClickableCandidates().filter((node) => {
      const hint = getMapElementHint(node);
      return isPointerRouteHint(hint) && isLikelyPokeballCatchRouteHint(hint) && !isDisabledRouteHint(hint);
    });
    if (pokeballNodes[0]) {
      log("Opening first pokeball catch node.");
      return pokeballNodes[0];
    }

    const grassNodes = getMapClickableCandidates().filter((node) => {
      const hint = getMapElementHint(node);
      return isPointerRouteHint(hint) && isLikelyGrassRouteHint(hint) && !isKnownNonCatchRouteHint(hint) && !isDisabledRouteHint(hint);
    });
    if (grassNodes[0]) {
      log("No pokeball catch node found; opening grass route fallback.");
      return grassNodes[0];
    }

    const fallback = findFirstMapRouteNodeFallback();
    if (fallback) {
      log("No known catch icon found; opening first available route fallback.");
      return fallback;
    }

    console.debug("[pkCharmanderHunter] No catch node found.", {
      catchCandidates: summarizeElements(uniqueElements(candidates), 12),
      mapElements: summarizeMapElements(20)
    });
    log("No visible catch node found.");
    return null;
  }

  function preferredClickableAncestor(el) {
    if (!el) return null;
    const clickable = el.closest("g.map-node--clickable, g.map-node, [role='button'], [tabindex], button, a, [onclick]");
    return clickable && isVisible(clickable) ? clickable : el;
  }

  function getMapContainer() {
    const map = document.querySelector("#map-container");
    return map && isVisible(map) ? map : null;
  }

  function getMapClickableCandidates() {
    const map = getMapContainer();
    if (!map) return [];

    const candidates = [];
    for (const selector of SELECTORS.mapClickables) {
      candidates.push(...queryAll(selector, map));
    }

    queryAll("img, image, svg *", map).forEach((el) => {
      const hint = getMapElementHint(el);
      if (isCatchRouteHint(hint) || isLikelyPokeballCatchRouteHint(hint) || isLikelyGrassRouteHint(hint) || /cursor:\s*pointer/i.test(hint)) {
        candidates.push(preferredClickableAncestor(el));
      }
    });

    return uniqueElements(candidates)
      .filter((el) => el && el instanceof Element && isVisible(el))
      .filter((el) => !el.closest("#run-menu-bar, .map-menu-icons, #map-node-tooltip, #item-tooltip, #trait-tooltip"));
  }

  function getMapElementHint(el) {
    if (!el) return "";
    const attrs = [
      el.id,
      typeof el.className === "string" ? el.className : "",
      el.getAttribute("aria-label"),
      el.getAttribute("title"),
      el.getAttribute("data-tip"),
      el.getAttribute("data-type"),
      el.getAttribute("data-node-type"),
      el.getAttribute("data-event"),
      el.getAttribute("href"),
      el.getAttribute("xlink:href"),
      el.getAttribute("src"),
      el.getAttribute("style"),
      getElementText(el)
    ];
    const image = el.querySelector && el.querySelector("image, img");
    if (image) {
      attrs.push(image.getAttribute("href"), image.getAttribute("xlink:href"), image.getAttribute("src"), image.getAttribute("alt"));
    }
    return attrs.filter(Boolean).join(" ");
  }

  function isCatchRouteHint(hint) {
    return /catchPokemon|catch-pokemon|catch_pokemon|pokemon-route|wild|encounter/i.test(hint);
  }

  function isLikelyGrassRouteHint(hint) {
    return /img\/sprites\/g\d\/grass\.png|\/grass\.png/i.test(hint);
  }

  function isLikelyPokeballCatchRouteHint(hint) {
    return /img\/sprites\/g\d\/pokeball\.png|\/pokeball\.png/i.test(hint);
  }

  function isKnownNonCatchRouteHint(hint) {
    return /bug-catcher|team-rocket|hiker|scientist|ace-trainer|mistery-trainer|mystery-trainer|item-icon|poke-center|question-mark|trainer/i.test(hint);
  }

  function isDisabledRouteHint(hint) {
    return /cursor:\s*default|opacity:\s*0\.75|filter:\s*brightness|done|complete|disabled|locked/i.test(hint);
  }

  function isPointerRouteHint(hint) {
    return /cursor:\s*pointer/i.test(hint);
  }

  function findFirstMapRouteNodeFallback() {
    const candidates = getMapClickableCandidates();
    if (!candidates.length) return null;

    const scored = candidates.map((el, index) => {
      const hint = getMapElementHint(el);
      const pointer = isPointerRouteHint(hint);
      let score = pointer ? 20 : 140;
      score += index;
      if (isCatchRouteHint(hint)) score -= 90;
      if (isLikelyPokeballCatchRouteHint(hint)) score -= 100;
      if (isLikelyGrassRouteHint(hint)) score -= 35;
      if (/map-node|node|route/i.test(hint)) score -= 10;
      if (isDisabledRouteHint(hint)) score += 160;
      if (isKnownNonCatchRouteHint(hint)) score += 90;
      if (/done|complete|disabled|locked|tooltip|menu|reset|home|settings|pokedex|achievement/i.test(hint)) score += 120;
      const rect = el.getBoundingClientRect();
      return { el, score, top: rect.top, left: rect.left, hint };
    });

    scored.sort((a, b) => (a.score - b.score) || (a.top - b.top) || (a.left - b.left));
    console.debug("[pkCharmanderHunter] Map clickable fallback candidates", scored.slice(0, 12).map((row) => ({
      score: row.score,
      element: describeElement(row.el),
      hint: row.hint
    })));
    return scored[0].score < 100 ? scored[0].el : null;
  }

  function summarizeElements(elements, limit = 8) {
    return elements.slice(0, limit).map((el) => {
      const rect = el.getBoundingClientRect();
      const href = el.getAttribute("href") || el.getAttribute("xlink:href") || el.getAttribute("src") || "";
      return `${describeElement(el)} visible=${isVisible(el)} box=${Math.round(rect.width)}x${Math.round(rect.height)} href=${href}`;
    }).join(" | ");
  }

  function summarizeMapElements(limit = 20) {
    return inspectMapElements().slice(0, limit).map((row) => `${row.element} visible=${row.visible} box=${row.box} hint=${row.hint.slice(0, 140)}`).join(" | ");
  }

  function inspectTowerEntrances() {
    const selectors = ["#btn-endless-run", "#btn-continue-endless", ".title-mode-card--tower", ".title-mode-resume--tower"];
    return selectors.flatMap((selector) => queryAll(selector).map((el) => ({
      selector,
      visible: isVisible(el),
      text: getElementText(el),
      element: describeElement(el)
    })));
  }

  function inspectCatchNodes() {
    const explicitNodes = uniqueElements([
      ...SELECTORS.catchIcons.flatMap((selector) => queryAll(selector)),
      ...queryAll("#map-container svg image, svg image").filter((el) => /catchPokemon/i.test(el.getAttribute("href") || el.getAttribute("xlink:href") || "")),
      ...queryAll("#map-container img, img").filter((el) => /catchPokemon/i.test(el.getAttribute("src") || "")),
      ...queryAll("#map-container svg g.map-node--clickable, #map-container svg g.map-node").filter((node) => {
        const image = node.querySelector("image, img");
        const href = image ? image.getAttribute("href") || image.getAttribute("xlink:href") || image.getAttribute("src") || "" : "";
        return /catchPokemon/i.test(href);
      })
    ]);
    const nodes = uniqueElements([...explicitNodes, ...getMapClickableCandidates()]);

    return nodes.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        visible: isVisible(el),
        box: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
        href: el.getAttribute("href") || el.getAttribute("xlink:href") || el.getAttribute("src") || "",
        hint: getMapElementHint(el).slice(0, 240),
        element: describeElement(el)
      };
    });
  }

  function inspectMapElements() {
    const map = document.querySelector("#map-container");
    if (!map) return [];
    return uniqueElements([
      map,
      ...queryAll(":scope > *", map),
      ...queryAll("[role='button'], [tabindex], [onclick], [style*='cursor'], button, a, img, image, svg, svg g, svg path, svg rect, svg circle, svg text", map)
    ]).map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        visible: isVisible(el),
        box: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
        hint: getMapElementHint(el),
        element: describeElement(el)
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Bot actions
  // ---------------------------------------------------------------------------

  async function selectConfiguredStarter() {
    const starterPokemon = settings.starterPokemon;
    const card = await waitForCondition(() => {
      const starterRoot = document.querySelector("#starter-choices") || document.querySelector("#starter-screen") || document;
      return findPokemonCardInCards(getAllPokemonCards(starterRoot), starterPokemon, false);
    }, 7000, 250, `${starterPokemon} starter card`);

    if (!card) {
      throw new Error(`${starterPokemon} not available as a Battle Tower starter. Make sure it is unlocked or caught.`);
    }

    return safeClick(getClickableCardElement(card), `starter ${starterPokemon}`);
  }

  async function openFirstCatchNode() {
    const icon = await waitForCondition(findCatchRouteIcon, 9000, 250, "first catch route icon");
    if (!icon) {
      throw new Error("No visible catch Pokemon route node found.");
    }

    if (!safeClick(icon, "first catch Pokemon route node")) return false;

    const choices = await waitForCondition(() => {
      if (detectCurrentScreen() === "catch-screen") return true;
      const cards = getVisibleChoiceCards();
      return cards.some((card) => getPokemonName(card)) ? cards : null;
    }, 12000, 250, "Pokemon choice screen");

    if (!choices) {
      throw new Error("Catch node clicked, but Pokemon choices did not appear.");
    }
    return true;
  }

  async function resetRun() {
    if (settings.dryRun) {
      log("[dry run] Would reset or reroll the run.");
      return false;
    }

    const before = screenSnapshot();
    pressKey("r", "KeyR");
    await sleep(1200);
    if (screenSnapshot() !== before || detectCurrentScreen() === "title-screen" || detectCurrentScreen() === "starter-screen" || detectCurrentScreen() === "endless-stage-select") {
      log("Reset/reroll appears to have responded to R.");
      return true;
    }

    const directNewRun = document.querySelector(SELECTORS.newRunButton);
    if (directNewRun && isVisible(directNewRun) && safeClick(directNewRun, "new run button")) {
      await sleep(1200);
      return true;
    }

    const fallbackLabels = ["Reset Run", "Play Again", "Main Menu", "New Run"];
    for (const label of fallbackLabels) {
      const button = findButtonByText([label]);
      if (button && safeClick(button, label)) {
        await sleep(1200);
        return true;
      }
    }

    log("All reset methods failed; reloading as last fallback.");
    window.location.reload();
    return true;
  }

  function screenSnapshot() {
    const screen = detectCurrentScreen();
    const text = bodyText().slice(0, 1200);
    return `${screen}:${text.length}:${text.slice(0, 120)}`;
  }

  async function inspectChoicesForTarget() {
    const cards = getVisibleChoiceCards();
    const targetPokemon = settings.targetPokemon;
    if (settings.dryRun) logChoiceCards();

    const target = findPokemonCardInCards(cards, targetPokemon, true);
    if (target) {
      runtime.foundCard = target;
      return { kind: "target", card: target, name: targetPokemon };
    }

    const anyShiny = findAnyShinyCard(cards);
    if (anyShiny) {
      if (settings.stopOnAnyShiny) runtime.foundCard = anyShiny;
      return { kind: "non-target-shiny", card: anyShiny, name: getPokemonName(anyShiny) || "unknown Pokemon" };
    }

    const normalTarget = findPokemonCardInCards(cards, targetPokemon, false);
    if (normalTarget) {
      return { kind: "normal-target", card: normalTarget, name: targetPokemon };
    }

    return { kind: "none" };
  }

  function bestChoiceResult(results) {
    const priority = {
      target: 3,
      "non-target-shiny": 2,
      "normal-target": 1,
      none: 0
    };
    return results
      .filter(Boolean)
      .sort((a, b) => (priority[b.kind] || 0) - (priority[a.kind] || 0))[0] || { kind: "none" };
  }

  function shouldStopForChoiceResult(result) {
    return result.kind === "target" || (result.kind === "non-target-shiny" && settings.stopOnAnyShiny);
  }

  function stopForChoiceResult(result) {
    if (result.kind === "target") {
      setState(STATES.CATCH_TARGET, `Shiny ${settings.targetPokemon} detected.`);
      return true;
    }

    if (result.kind === "non-target-shiny" && settings.stopOnAnyShiny) {
      highlightCard(result.card);
      announceFound(`Shiny ${result.name} found in ${runtime.attempts} attempts.`);
      return true;
    }

    return false;
  }

  async function catchTargetIfConfigured() {
    const card = runtime.foundCard;
    if (!card) throw new Error("No found target card is available.");

    highlightCard(card);

    if (settings.autoCatch) {
      safeClick(getClickableCardElement(card), `shiny ${settings.targetPokemon}`);
      await sleep(400);
    } else {
      log("Auto catch disabled; leaving shiny card selected only by highlight.");
    }

    announceFound(`Shiny ${settings.targetPokemon} found in ${runtime.attempts} attempts!`);
  }

  function highlightCard(card) {
    if (!card || !(card instanceof HTMLElement || card instanceof SVGElement)) return;
    card.style.outline = "5px solid #ffd700";
    card.style.outlineOffset = "3px";
    card.style.boxShadow = "0 0 0 4px #111827, 0 0 28px 10px rgba(255, 215, 0, 0.85)";
  }

  function announceFound(message) {
    runtime.running = false;
    runtime.paused = false;
    runtime.foundMessage = message;
    runtime.attempts = 0;
    persistAttempts();
    setState(STATES.FOUND, message);
    playFoundSound();
    updateOverlay();
    window.setTimeout(() => window.alert(message), 50);
  }

  function playFoundSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
      gain.connect(ctx.destination);

      [880, 1175, 1568].forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + index * 0.22);
        oscillator.connect(gain);
        oscillator.start(ctx.currentTime + index * 0.22);
        oscillator.stop(ctx.currentTime + index * 0.22 + 0.16);
      });
      window.setTimeout(() => ctx.close().catch(() => {}), 1500);
    } catch (error) {
      log(`Sound failed: ${error.message || error}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Finite state machine
  // ---------------------------------------------------------------------------

  function startBot() {
    if (runtime.running) {
      runtime.paused = false;
      log("Bot already running; unpaused.");
      updateOverlay();
      return;
    }
    runtime.running = true;
    runtime.paused = false;
    runtime.lastError = "";
    runtime.stopReason = "";
    runtime.consecutiveErrors = 0;
    runtime.foundCard = null;
    runtime.foundMessage = "";
    runtime.loopToken += 1;
    setState(STATES.ENTER_MAIN_MENU, "Started.");
    runLoop(runtime.loopToken);
  }

  function stopBot(reason, state = STATES.STOPPED) {
    runtime.running = false;
    runtime.paused = false;
    runtime.stopReason = reason || "";
    setState(state, reason || "Stopped.");
  }

  function togglePause() {
    if (!runtime.running) return;
    runtime.paused = !runtime.paused;
    log(runtime.paused ? "Paused." : "Resumed.");
    updateOverlay();
  }

  function setState(state, message = "") {
    runtime.state = state;
    runtime.lastMessage = message;
    if (message) log(`${state}: ${message}`);
    else log(`Entering ${state}`);
    updateOverlay();
  }

  async function runLoop(token) {
    while (runtime.running && token === runtime.loopToken) {
      if (runtime.paused) {
        await sleep(250);
        continue;
      }

      try {
        log(`Entering ${runtime.state}`);
        await runStateWithTimeout(runtime.state);
        runtime.consecutiveErrors = 0;
      } catch (error) {
        await handleStateError(error);
      }

      if (runtime.running) {
        await randomSleep(settings.minDelayMs, settings.maxDelayMs);
      }
    }
  }

  async function runStateWithTimeout(state) {
    const timeoutMs = STATE_TIMEOUTS[state] || 10000;
    let timerId = 0;
    const timeout = new Promise((_, reject) => {
      timerId = window.setTimeout(() => reject(new Error(`${state} timed out after ${timeoutMs} ms.`)), timeoutMs);
    });

    try {
      await Promise.race([runState(state), timeout]);
    } finally {
      window.clearTimeout(timerId);
    }
  }

  async function runState(state) {
    if (state === STATES.IDLE) {
      stopBot("Idle.", STATES.STOPPED);
      return;
    }

    if (state === STATES.ENTER_MAIN_MENU) {
      setState(stateForCurrentScreen(), "Routed from current screen.");
      return;
    }

    if (state === STATES.ENTER_BATTLE_TOWER) {
      await enterBattleTowerState();
      return;
    }

    if (state === STATES.SELECT_REGION) {
      await selectRegionState();
      return;
    }

    if (state === STATES.SELECT_STARTER) {
      await selectStarterState();
      return;
    }

    if (state === STATES.OPEN_FIRST_CATCH_NODE) {
      await openFirstCatchNodeState();
      return;
    }

    if (state === STATES.WAIT_FOR_POKEMON_CHOICES) {
      await waitForPokemonChoicesState();
      return;
    }

    if (state === STATES.CHECK_FOR_SHINY_TARGET) {
      await checkForShinyTargetState();
      return;
    }

    if (state === STATES.CATCH_TARGET) {
      await catchTargetIfConfigured();
      return;
    }

    if (state === STATES.RESET_RUN) {
      await resetRunState();
      return;
    }

    if (state === STATES.FOUND || state === STATES.ERROR || state === STATES.STOPPED) {
      runtime.running = false;
      updateOverlay();
      return;
    }

    throw new Error(`Unknown FSM state: ${state}`);
  }

  async function enterBattleTowerState() {
    const screen = detectCurrentScreen();
    runtime.lastScreen = screen;

    if (screen === "maintenance") {
      throw new Error("Pokelike maintenance gate is visible.");
    }
    if (screen === "endless-stage-select" || screen === "starter-screen" || screen === "map-screen" || screen === "catch-screen") {
      setState(stateForCurrentScreen(), "Already in Battle Tower flow.");
      return;
    }
    if (screen === "gameover-screen" || screen === "win-screen" || screen === "endless-stage-complete") {
      setState(STATES.RESET_RUN, "Existing run end screen detected.");
      return;
    }

    const historyTower = document.querySelector("#btn-history-battle-tower");
    if (historyTower && isVisible(historyTower)) {
      safeClick(historyTower, "Battle Tower from Story screen");
      await waitForScreenChange(screen, 8000);
      setState(stateForCurrentScreen(), "Entered Battle Tower from Story screen.");
      return;
    }

    const continueTower = document.querySelector("#btn-continue-endless");
    const enterTower = document.querySelector("#btn-endless-run");
    const target = [continueTower, enterTower].find(isVisible)
      || findActionByText(["Resume Tower", "Enter Tower", "Battle Tower"], [".title-mode-card--tower", ".title-mode-resume--tower"]);

    if (!target) {
      throw new Error("Could not find a visible Battle Tower entry control.");
    }

    if (!safeClick(target, "Battle Tower entry")) {
      throw new Error(`Battle Tower entry control was found but could not be clicked: ${describeElement(target)}`);
    }
    const changed = await waitForScreenChange(screen, 10000);
    if (!changed) {
      throw new Error(`Clicked Battle Tower entry but screen stayed on ${screen}.`);
    }
    setState(stateForCurrentScreen(), "Battle Tower entry clicked.");
  }

  async function selectRegionState() {
    const region = selectedRegion();
    const screen = detectCurrentScreen();

    if (screen === "starter-screen" || screen === "map-screen" || screen === "catch-screen") {
      setState(stateForCurrentScreen(), `${region.label} stage already appears selected.`);
      return;
    }
    if (screen === "title-screen" || screen === "history-region-select") {
      setState(STATES.ENTER_BATTLE_TOWER, "Need to enter Battle Tower first.");
      return;
    }
    if (screen === "gameover-screen" || screen === "win-screen" || screen === "endless-stage-complete") {
      const stageSelect = document.querySelector("#btn-stage-continue") || findButtonByText(["Stage Select", "Climb the Tower"]);
      if (stageSelect && isVisible(stageSelect)) {
        safeClick(stageSelect, "Stage Select");
        await waitForCondition(() => detectCurrentScreen() === "endless-stage-select", 8000, 250, "stage select");
      } else {
        setState(STATES.RESET_RUN, "End screen without Stage Select; resetting.");
        return;
      }
    }

    if (detectCurrentScreen() !== "endless-stage-select") {
      const stageButton = findButtonByText(["Stage Select"]);
      if (stageButton && safeClick(stageButton, "Stage Select")) {
        await waitForCondition(() => detectCurrentScreen() === "endless-stage-select", 8000, 250, "stage select");
      }
    }

    const regionButton = findStageButton(region.stageName);
    if (regionButton && regionButton.locked) {
      throw new Error(`${region.label} Battle Tower appears locked or unavailable.`);
    }
    if (!regionButton) {
      throw new Error(`Could not find the ${region.label} Battle Tower stage control.`);
    }

    safeClick(regionButton, `${region.label} Battle Tower`);
    await waitForCondition(() => {
      const next = detectCurrentScreen();
      return next === "starter-screen" || next === "map-screen" || next === "catch-screen";
    }, 10000, 250, `starter/map after ${region.label}`);
    setState(stateForCurrentScreen(), `${region.label} selected.`);
  }

  async function selectStarterState() {
    const screen = detectCurrentScreen();
    if (screen === "map-screen" || screen === "catch-screen") {
      setState(stateForCurrentScreen(), "Starter already selected.");
      return;
    }
    if (screen === "title-screen" || screen === "history-region-select" || screen === "endless-stage-select") {
      setState(stateForCurrentScreen(), "Need earlier setup step.");
      return;
    }
    if (screen !== "starter-screen") {
      setState(STATES.RESET_RUN, `Unexpected screen while selecting starter: ${screen}`);
      return;
    }

    await selectConfiguredStarter();
    await waitForCondition(() => {
      const next = detectCurrentScreen();
      return next === "map-screen" || next === "catch-screen";
    }, 9000, 250, "map after starter");
    setState(stateForCurrentScreen(), `${settings.starterPokemon} selected.`);
  }

  async function openFirstCatchNodeState() {
    const screen = detectCurrentScreen();
    if (screen === "catch-screen") {
      setState(STATES.WAIT_FOR_POKEMON_CHOICES, "Already on Pokemon choice screen.");
      return;
    }
    if (screen === "title-screen" || screen === "history-region-select" || screen === "endless-stage-select" || screen === "starter-screen") {
      setState(stateForCurrentScreen(), "Need earlier setup step.");
      return;
    }
    if (screen !== "map-screen") {
      setState(STATES.RESET_RUN, `Not on route map (${screen}); resetting to start loop.`);
      return;
    }

    await openFirstCatchNode();
    setState(STATES.WAIT_FOR_POKEMON_CHOICES, "Catch node opened.");
  }

  async function waitForPokemonChoicesState() {
    const choices = await waitForCondition(() => {
      const screen = detectCurrentScreen();
      if (screen !== "catch-screen") return null;
      const cards = getVisibleChoiceCards();
      return cards.some((card) => getPokemonName(card)) ? cards : null;
    }, 12000, 250, "visible Pokemon choice cards");

    if (!choices) {
      const next = stateForCurrentScreen();
      if (next !== STATES.WAIT_FOR_POKEMON_CHOICES) {
        setState(next, "Pokemon choices not visible; routed by screen.");
        return;
      }
      throw new Error("Pokemon choice cards were not visible.");
    }

    setState(STATES.CHECK_FOR_SHINY_TARGET, "Pokemon choices visible.");
  }

  async function checkForShinyTargetState() {
    runtime.attempts += 1;
    persistAttempts();
    updateOverlay();

    const results = [];
    const firstResult = await inspectChoicesForTarget();
    results.push(firstResult);
    if (shouldStopForChoiceResult(firstResult) && stopForChoiceResult(firstResult)) return;

    const rerollCount = await useChoiceRerollsOnce();
    if (rerollCount > 0) {
      const rerolledResult = await inspectChoicesForTarget();
      results.push(rerolledResult);
      if (shouldStopForChoiceResult(rerolledResult) && stopForChoiceResult(rerolledResult)) return;
    }

    const result = bestChoiceResult(results);
    if (result.kind === "non-target-shiny") {
      log(`A Shiny! Too bad it's not ${settings.targetPokemon} :(`);
    } else if (result.kind === "normal-target") {
      log(`${settings.targetPokemon}! Too bad it's not shiny! :(`);
    } else {
      log("No target");
    }

    if (settings.stopAfterAttempts > 0 && runtime.attempts >= settings.stopAfterAttempts) {
      stopBot(`Stop after ${settings.stopAfterAttempts} attempts reached.`, STATES.STOPPED);
      return;
    }

    setState(STATES.RESET_RUN, "No shiny target; resetting.");
  }

  async function resetRunState() {
    const ok = await resetRun();
    if (!ok && settings.dryRun) {
      stopBot("Dry run reset skipped. No page action was taken.", STATES.STOPPED);
      return;
    }
    await waitForCondition(() => {
      const next = stateForCurrentScreen();
      return next !== STATES.RESET_RUN ? next : null;
    }, 10000, 250, "post-reset setup screen");
    setState(STATES.ENTER_MAIN_MENU, "Reset completed.");
  }

  async function waitForScreenChange(previousScreen, timeoutMs) {
    return waitForCondition(() => {
      const next = detectCurrentScreen();
      return next && next !== previousScreen ? next : null;
    }, timeoutMs, 250, `screen change from ${previousScreen}`);
  }

  async function handleStateError(error) {
    const message = error && error.message ? error.message : String(error);
    runtime.lastError = message;
    runtime.consecutiveErrors += 1;
    log(`Error ${runtime.consecutiveErrors}/${settings.maxConsecutiveErrors || CONFIG.maxConsecutiveErrors}: ${message}`);
    updateOverlay();

    if (runtime.consecutiveErrors >= (settings.maxConsecutiveErrors || CONFIG.maxConsecutiveErrors)) {
      stopBot(`Too many consecutive errors: ${message}`, STATES.ERROR);
      return;
    }

    const screen = detectCurrentScreen();
    if (screen === "catch-screen") {
      setState(STATES.CHECK_FOR_SHINY_TARGET, "Fallback to choice inspection.");
      return;
    }
    if (screen === "map-screen") {
      setState(STATES.OPEN_FIRST_CATCH_NODE, "Fallback to map catch node.");
      return;
    }
    if (screen === "starter-screen") {
      setState(STATES.SELECT_STARTER, "Fallback to starter selection.");
      return;
    }
    if (screen === "endless-stage-select") {
      setState(STATES.SELECT_REGION, "Fallback to region stage selection.");
      return;
    }

    setState(STATES.RESET_RUN, "Fallback to reset after error.");
  }

  // ---------------------------------------------------------------------------
  // Debug helpers
  // ---------------------------------------------------------------------------

  function testShinyDetection() {
    const related = uniqueElements([
      ...queryAll("[class*='shiny']"),
      ...queryAll(".shiny-badge"),
      ...queryAll("img[src*='/shiny/']"),
      ...queryAll("image[href*='/shiny/']")
    ]).filter(isVisible);

    const rows = related.map((el) => ({
      element: el,
      tag: el.tagName.toLowerCase(),
      classes: typeof el.className === "string" ? el.className : "",
      src: el.getAttribute("src") || el.getAttribute("href") || el.getAttribute("xlink:href") || "",
      text: getElementText(el)
    }));
    console.table(rows.map((row) => ({
      tag: row.tag,
      classes: row.classes,
      src: row.src,
      text: row.text
    })));
    return rows;
  }

  function exposeDebugObject() {
    window.pkHunterDebug = {
      cards: () => getCardDebugRows(),
      catchNodes: () => inspectCatchNodes(),
      rerolls: () => getRerollControlDebugRows(),
      mapElements: () => inspectMapElements(),
      towerEntrances: () => inspectTowerEntrances(),
      log: () => buildDebugLog(),
      copyLog: () => copyDebugLog(),
      state: () => ({
        running: runtime.running,
        paused: runtime.paused,
        state: runtime.state,
        attempts: runtime.attempts,
        consecutiveErrors: runtime.consecutiveErrors,
        settings: { ...settings }
      }),
      stop: () => stopBot("Stopped through window.pkHunterDebug.stop().", STATES.STOPPED),
      testShinyDetection
    };
  }

  // ---------------------------------------------------------------------------
  // Logging and startup
  // ---------------------------------------------------------------------------

  function log(message, data) {
    const line = `${new Date().toLocaleTimeString()} ${message}`;
    if (isOverlayLogMessage(message)) {
      runtime.logs.push(line);
      if (runtime.logs.length > 120) runtime.logs.splice(0, runtime.logs.length - 120);
    }
    if (data !== undefined) {
      console.log("[pkCharmanderHunter]", message, data);
    } else {
      console.log("[pkCharmanderHunter]", message);
    }
    updateOverlay();
  }

  function isOverlayLogMessage(message) {
    return message === "No target"
      || message === `${settings.targetPokemon}! Too bad it's not shiny! :(`
      || message === `A Shiny! Too bad it's not ${settings.targetPokemon} :(`;
  }

  function buildDebugLog() {
    const payload = {
      script: "Pokelike Shiny Hunter",
      version: SCRIPT_VERSION,
      url: location.href,
      userAgent: navigator.userAgent,
      time: new Date().toISOString(),
      state: {
        running: runtime.running,
        paused: runtime.paused,
        state: runtime.state,
        attempts: runtime.attempts,
        consecutiveErrors: runtime.consecutiveErrors,
        lastError: runtime.lastError,
        lastScreen: runtime.lastScreen || detectCurrentScreen(),
        settings: { ...settings }
      },
      activeScreen: activeScreenId(),
      detectedScreen: detectCurrentScreen(),
      towerEntrances: inspectTowerEntrances(),
      catchNodes: inspectCatchNodes(),
      rerollControls: getRerollControlDebugRows(),
      mapElements: inspectMapElements().slice(0, 80),
      cards: getCardDebugRows(getVisibleChoiceCards()).map((row) => ({
        name: row.name,
        shiny: row.shiny,
        element: describeElement(row.element)
      })),
      logs: runtime.logs.slice(-80)
    };
    return JSON.stringify(payload, null, 2);
  }

  async function copyDebugLog() {
    const text = buildDebugLog();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        log("Debug log copied to clipboard.");
        return text;
      }
    } catch (error) {
      log(`Clipboard copy failed: ${error.message || error}`);
    }

    console.log("[pkCharmanderHunter] Debug log:", text);
    log("Debug log printed to console because clipboard copy was unavailable.");
    return text;
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      stopBot("Stopped by Escape hotkey.", STATES.STOPPED);
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === "Insert") {
      toggleOverlayVisibility();
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  function init() {
    migratePanelLayoutDefaults();
    createOverlay();
    exposeDebugObject();
    log("Loaded.");
    if (settings.autoResume) {
      window.setTimeout(() => startBot(), 800);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
