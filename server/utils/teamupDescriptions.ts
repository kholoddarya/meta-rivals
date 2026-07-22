// Описания тимапов из Marvel Rivals
// Источник: https://www.turtlebeach.com/blog/marvel-rivals-all-team-up-abilities-and-what-they-do

export const TEAMUP_DESCRIPTIONS: Record<
  string,
  { title: string; description: string; bonuses: string[] }
> = {
  // Thor + Storm/Captain America
  'THOR|STORM': {
    title: 'Voltaic Union',
    description:
      "Storm gains access to Thor's Thorforce, granting electrical augmentations. When enhanced, Storm can create a storm barrage.",
    bonuses: ['+5% Speed Boost', 'Thunder Power'],
  },
  'THOR|CAPTAIN AMERICA': {
    title: 'Voltaic Union',
    description:
      "Captain America gains access to Thor's Thorforce. Cap's shield becomes imbued with thunderpower and he gets a speed boost.",
    bonuses: ['+5% Speed Boost', 'Thunder-Imbued Shield'],
  },

  // Iron Fist + Luna Snow
  'IRON FIST|LUNA SNOW': {
    title: 'Atlas Bond',
    description:
      'Iron Fist imbues Luna Snow with Chi, granting her a new ability. When activated, she creates a powerful blast around her that pushes back enemies with damage and applies a slowing effect, while also healing her allies.',
    bonuses: ['Chi Blast', 'Healing', 'Slow Effect'],
  },

  // Spider-Man + Squirrel Girl
  'SPIDER-MAN|SQUIRREL GIRL': {
    title: 'ESU Alumnus',
    description:
      'Spider-Man grants Squirrel Girl a new web bomb ability. She launches the bomb, and when it hits a player or the environment, it explodes, webbing up anyone caught in its blast radius.',
    bonuses: ['Web Bomb', 'Enemy Snare'],
  },

  // Cloak & Dagger + Moon Knight
  'CLOAK & DAGGER|MOON KNIGHT': {
    title: 'Lunar Force',
    description:
      'When paired with Cloak & Dagger, Moon Knight gets access to a new ability. When activated, it creates a dome around Moon Knight for 6 seconds. When inside the dome, Moon Knight is invisible.',
    bonuses: ['Invisibility Dome', '6 Second Duration'],
  },

  // Hawkeye + Black Widow
  'HAWKEYE|BLACK WIDOW': {
    title: 'Allied Agents',
    description:
      "When Black Widow is paired up on the battlefield with her best friend Hawkeye, she gets a new ability, giving her access to his Hunter's Sight. This allows her to shoot still afterimages of enemies.",
    bonuses: ["Hunter's Sight", 'Afterimage Tracking'],
  },

  // Hulk + Wolverine
  'HULK|WOLVERINE': {
    title: 'Fastball Special',
    description:
      'When both Hulk and Wolverine are on the same team, Logan can crawl into the arms of Hulk who then catapults him into the enemies to cause havoc.',
    bonuses: ['Catapult Launch', 'Area Disruption'],
  },

  // Loki + Hela
  'LOKI|HELA': {
    title: 'Ragnarok Rebirth',
    description:
      'When Hela lands a final hit in defeating an enemy, she can instantly resurrect Loki in the respawn phase.',
    bonuses: ['Instant Resurrection', 'Team Sustain'],
  },

  // Scarlet Witch + Magneto
  'SCARLET WITCH|MAGNETO': {
    title: 'Metallic Chaos',
    description:
      'Scarlet Witch can infuse Chaos Energy into Magneto to enchant his greatsword. Upon receiving the Chaos Energy, Magneto can unleash its full force, striking down enemies with his enchanted greatsword.',
    bonuses: ['Enchanted Sword', 'Chaos Damage'],
  },

  // Venom + Spider-Man + Peni Parker
  'VENOM|SPIDER-MAN': {
    title: 'Symbiote Bond',
    description:
      'Venom shares a part of his symbiotes with Spider-Man, activating symbiote abilities. Spider-Man can convert the symbiote into explosive spikes that inflict harm on nearby enemies.',
    bonuses: ['Symbiote Spikes', 'Area Damage'],
  },
  'VENOM|PENI PARKER': {
    title: 'Symbiote Bond',
    description:
      'Venom shares a part of his symbiotes with Peni Parker, activating symbiote abilities. Peni Parker can convert the symbiote into explosive spikes.',
    bonuses: ['Symbiote Spikes', 'Area Damage'],
  },

  // Black Panther + Magik
  'BLACK PANTHER|MAGIK': {
    title: 'Limbo Shortcut',
    description:
      'Magik opens a portal that Black Panther can use to teleport to other locations on the map.',
    bonuses: ['Teleportation', 'Map Mobility'],
  },

  // The Punisher + Rocket Raccoon
  'THE PUNISHER|ROCKET RACCOON': {
    title: 'Ammo Overload',
    description:
      "Rocket Raccoon throws an Ammo Overload Device. Upon entering the device's range, The Punisher receives the buffs of Infinite Ammo and Faster Firing.",
    bonuses: ['Infinite Ammo', 'Faster Fire Rate'],
  },

  // Groot + Rocket Raccoon
  'GROOT|ROCKET RACCOON': {
    title: 'Planet X Pals',
    description: "Rocket Raccoon can ride on Groot's shoulders, receiving damage reduction.",
    bonuses: ['Damage Reduction', 'Mounted Position'],
  },

  // Iron Man + Hulk + Doctor Strange
  'IRON MAN|HULK': {
    title: 'Gamma Charge',
    description:
      'Hulk charges Iron Man with gamma radiation. When Iron Man uses Armor Overdrive, he will initiate a gamma upgrade.',
    bonuses: ['Gamma Upgrade', 'Enhanced Armor'],
  },
  'HULK|DOCTOR STRANGE': {
    title: 'Gamma Charge',
    description:
      'Hulk charges Doctor Strange with gamma radiation. When Doctor Strange uses Maelstrom of Madness, he unleashes excess gamma energy.',
    bonuses: ['Gamma Energy', 'Enhanced Ultimate'],
  },

  // Luna Snow + Namor
  'LUNA SNOW|NAMOR': {
    title: 'Chilling Charisma',
    description:
      'Luna Snow infuses ice energy into Namor, who then can tap into the ice energy to power up abilities at will.',
    bonuses: ['Ice Energy', 'Enhanced Abilities'],
  },

  // Adam Warlock + Star Lord + Mantis
  'ADAM WARLOCK|STAR-LORD': {
    title: 'Guardian Revival',
    description:
      'Adam Warlock enhances the rebirth power of Star Lord, granting him cocooned revival.',
    bonuses: ['Cocoon Revival', 'Team Sustain'],
  },
  'ADAM WARLOCK|MANTIS': {
    title: 'Guardian Revival',
    description:
      'Adam Warlock enhances the rebirth power of Mantis, granting her cocooned revival.',
    bonuses: ['Cocoon Revival', 'Team Sustain'],
  },
}

export function getTeamupKey(hero1: string, hero2: string): string {
  return [hero1, hero2].sort().join('|')
}

export function getTeamupDescription(hero1: string, hero2: string) {
  const key = getTeamupKey(hero1, hero2)
  return TEAMUP_DESCRIPTIONS[key] || null
}
