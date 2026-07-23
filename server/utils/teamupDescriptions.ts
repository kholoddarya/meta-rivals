// server/utils/teamupDescriptions.ts
export interface TeamUpEntry {
  grade: 'S' | 'SA' | 'A' | 'B'
  confirmed: boolean
  title: string | null
  description: string | null
  bonuses: string[]
}

export const TEAM_UPS: Record<string, TeamUpEntry> = {
  'ADAM WARLOCK|STORM': {
    grade: 'A',
    confirmed: true,
    title: 'Cosmic Cyclone',
    description:
      'Teammates linked by Soul Bond receive a Speed Boost. When teaming up with Storm, linked teammates additionally gain a Damage Boost.',
    bonuses: ['Speed Boost', 'Damage Boost'],
  },
  'ADAM WARLOCK|ULTRON': {
    grade: 'SA',
    confirmed: true,
    title: 'Flawless Design',
    description:
      'Cosmic Cluster now provides healing to allies. When teaming up with Ultron, Cosmic Cluster creates an explosion upon impact.',
    bonuses: ['Team Healing', 'Impact Explosion'],
  },
  'ANGELA|LOKI': {
    grade: 'SA',
    confirmed: true,
    title: "Odin's Unacknowledged",
    description:
      "Project an Illusion forward. The illusion utilizes Assassin's Charge to thrust at enemies. Enemies struck head-on will be carried through the air for a short while. When teaming up with Loki, the ability gains two charges.",
    bonuses: ['Illusion Projection', "Assassin's Charge", 'Air Carry', 'Two Charges'],
  },
  'ANGELA|STAR-LORD': {
    grade: 'B',
    confirmed: true,
    title: 'Asgardians of the Galaxy',
    description:
      'Activation grants Reveal within a targeted area. Activating the ability again performs a slam attack; enemies hit by the slam are Grounded. When teaming up with Star-Lord, Angela gains Bonus Health scaling with the number of enemies struck by the slam.',
    bonuses: ['Reveal', 'Slam Attack', 'Grounded', 'Bonus Health Scaling'],
  },
  'BLACK PANTHER|MAGIK': {
    grade: 'A',
    confirmed: true,
    title: 'Dimensional Shortcut',
    description:
      'Activate a Limbo stepping disc to instantly return to your position from a few seconds ago, gaining Bonus Health in the process. When the teleport ends, the disc collapses in an explosion, damaging nearby enemies and applying Vibranium Marks. When teaming up with Magik, the teleportation sequence can be manually canceled mid-transit.',
    bonuses: ['Teleport', 'Bonus Health', 'AoE Damage', 'Vibranium Marks', 'Manual Cancel'],
  },
  'BLACK PANTHER|STORM': {
    grade: 'S',
    confirmed: true,
    title: 'Damisa-Yao',
    description:
      'Trigger the elemental power stored within his armor, dealing damage and applying Slow to surrounding enemies while attaching Vibranium Marks. When teaming up with Storm, enemies within range are launched toward Black Panther.',
    bonuses: ['Damage', 'Slow', 'Vibranium Marks', 'Enemy Launch'],
  },
  'BLACK WIDOW|HAWKEYE': {
    grade: 'A',
    confirmed: true,
    title: 'Allied Agents',
    description:
      "Landing hits with Red Room Rifle builds Focus. At three stacks, enter a Focused state where the next bullet gains the Hunter's Sight effect, granting Damage Boost and pierce effects. When teaming up with Hawkeye, landing a critical hit prevents the Focused state from expiring, allowing continuous enhanced fire until missing a crit.",
    bonuses: [
      'Focus Stacks',
      "Hunter's Sight",
      'Damage Boost',
      'Pierce',
      'Sustained Focused State',
    ],
  },
  'BLACK WIDOW|PHOENIX': {
    grade: 'A',
    confirmed: true,
    title: 'Burning Bullets',
    description:
      'Activation grants the Red Room Rifle a Fire Rate Boost. Additionally, the Plasma Cannon projectile becomes a hitscan laser that no longer requires charging. When teaming up with Phoenix, her Plasma Cannon gains a second ability charge.',
    bonuses: ['Fire Rate Boost', 'Hitscan Laser', 'No Charge Required', 'Extra Charge'],
  },
  'BLADE|CAPTAIN AMERICA': {
    grade: 'B',
    confirmed: true,
    title: 'Bleed for Battle',
    description:
      'For every set amount of damage taken, Blade builds a stack of Bloodline Awakening. When teaming up with Captain America, taking critical damage instantly triggers the Bloodline Awakening state, gaining bonus stacks while raising the overall stack cap.',
    bonuses: [
      'Bloodline Awakening Stacks',
      'Instant Trigger on Crit',
      'Bonus Stacks',
      'Increased Stack Cap',
    ],
  },
  'BLADE|MOON KNIGHT': {
    grade: 'SA',
    confirmed: true,
    title: 'Blade of Khonshu',
    description:
      'Perform a heavy forward cleave with the Ancestral Sword while performing a short dash. At the end of the dash, swiftly slash four times, each strike sending a Darkmoon Blade forward. When a Darkmoon Blade hits an enemy, it bounces to nearby targets. When teaming up with Moon Knight, each Whirlwind Slash triggered generates one additional Darkmoon Blade.',
    bonuses: ['Heavy Cleave', 'Short Dash', 'Darkmoon Blade', 'Bounce Effect', 'Additional Blade'],
  },
  'BRUCE BANNER|CAPTAIN AMERICA': {
    grade: 'A',
    confirmed: true,
    title: 'Savage Slam',
    description:
      'Leap high and smash the ground, dealing damage to enemies and reducing the cooldowns of other abilities based on remaining Health. When teaming up with Captain America, the ground slam additionally applies Vulnerability to enemies hit.',
    bonuses: ['Cooldown Reduction', 'Vulnerability'],
  },
  'BRUCE BANNER|WOLVERINE': {
    grade: 'SA',
    confirmed: true,
    title: 'Gamma Fastball',
    description:
      'Enter a Furious state upon activation, gaining Speed Boost and Attack Speed for a duration. Also unlocks the Scars of Rage ability, granting Unstoppable for a period when Health drops to a certain threshold. When teaming up with Wolverine, unlocks the Fastball Special. Upon mutual confirmation, Hulk hurls Wolverine forward and enters Furious state.',
    bonuses: ['Speed Boost', 'Attack Speed', 'Unstoppable', 'Fastball Special'],
  },
  'CAPTAIN AMERICA|THOR': {
    grade: 'A',
    confirmed: true,
    title: 'Voltaic Union',
    description:
      'Modify Sentinel Strike into a Lightning Shield projectile. After landing two hits, Captain America launches the piercing Lightning Shield four times. When teaming up with Thor, the lightning energy imbued in the shield intensifies. Each hit from the Lightning Shield triggers an extra burst of damage in the surrounding area.',
    bonuses: ['Lightning Shield', 'Piercing Projectile', 'AoE Burst'],
  },
  'CAPTAIN AMERICA|WINTER SOLDIER': {
    grade: 'SA',
    confirmed: true,
    title: 'Stars Aligned',
    description:
      'Captain America can leap directly to a teammate, providing Bonus Health to both himself and the ally, while redirecting a portion of their incoming damage to himself. When teaming up with Winter Soldier, the duo can trigger a mutual rally. Upon confirmation, they charge at one another, slamming together to grant Bonus Health and Movement Speed to all nearby friends. The original effect remains; now additionally granting a Speed Boost to the targeted teammate.',
    bonuses: ['Bonus Health', 'Damage Redirect', 'Mutual Rally', 'Speed Boost'],
  },
  'CLOAK & DAGGER|HOOD': {
    grade: 'A',
    confirmed: true,
    title: 'Oblivion Shroud',
    description:
      'Veil of Lightforce and Terror Cape are warped by void magic, changing into Twilight Veil and Void Veil while retaining their original effects, after traveling a set distance, the veils halt in place. Enemy damage passing through the Twilight Veil is weakened, while enemy healing passing through the Void Veil suffers Healing Reduction. When teaming up with The Hood, the width of both the Twilight Veil and Void Veil expands. Additionally, allies passing through the veils are empowered by half-life energy, gaining Damage Boost for a duration.',
    bonuses: ['Expanded Veils', 'Damage Weaken', 'Healing Reduction', 'Damage Boost'],
  },
  'CLOAK & DAGGER|LUNA SNOW': {
    grade: 'SA',
    confirmed: true,
    title: 'Frozen Haven',
    description:
      'Channel frost energy outward to encase yourself in an absolute block of ice. This offers great protection, but Freezes you in place. While frozen, you can be healed and emit a weak healing aura to nearby allies. When teaming up with Luna Snow, the healing aura provided to allies while Frozen becomes significantly stronger.',
    bonuses: ['Invincible Freeze', 'Healing Aura', 'Enhanced Healing'],
  },
  'CYCLOPS|GAMBIT': {
    grade: 'SA',
    confirmed: true,
    title: 'Kinetic Kin',
    description:
      'Release stored kinetic energy to enter an enhanced state for a duration. While active, Cyclops gains significantly increased movement speed and jump height. When teaming up with Gambit, during the enhanced state, the attack speeds for both Optic Blast and Concussive Beam are increased.',
    bonuses: [
      'Enhanced State',
      'Increased Movement Speed',
      'Increased Jump Height',
      'Attack Speed Boost',
    ],
  },
  'CYCLOPS|PHOENIX': {
    grade: 'A',
    confirmed: true,
    title: 'Slim and Red',
    description:
      'Hitting an enemy with Ricochet Force summons the Phoenix Force to ignite them, causing continuous burn damage over a set duration. Hitting an ignited target with Optic Blast or Concussive Beam instantly triggers a percentage of the remaining burn damage as a single burst. When teaming up with Phoenix, Spark detonations reduce the cooldown of Ricochet Force.',
    bonuses: [
      'Phoenix Force Ignition',
      'Continuous Burn Damage',
      'Burst Damage',
      'Cooldown Reduction',
    ],
  },
  'DAREDEVIL|BLACK WIDOW': {
    grade: 'S',
    confirmed: true,
    title: 'Devilish Affair',
    description:
      "Swings Devil's Chain in a criss-cross pattern, dealing damage to enemies in front and inflicting a Slow. When teaming up with Black Widow, the damage radius is expanded, and landing hits recovers Fury.",
    bonuses: ['Criss-Cross Chain', 'Slow', 'Expanded Radius', 'Fury Recovery'],
  },
  'DAREDEVIL|IRON FIST': {
    grade: 'A',
    confirmed: true,
    title: 'Comprehensive Defense',
    description:
      'Objection! is enhanced. Whirling billy clubs now damage all enemies in range while deflecting Projectiles from all directions. Successfully deflecting attacks recovers Fury. When teaming up with Iron Fist, Daredevil passively recovers Health for the entire duration of the ability.',
    bonuses: [
      'Enhanced Objection!',
      'Projectile Deflect',
      'Fury Recovery',
      'Passive Health Recovery',
    ],
  },
  'DEADPOOL DPS|GAMBIT': {
    grade: 'A',
    confirmed: true,
    title: 'Gumbo Chimichangas',
    description:
      "When teaming up with Gambit, the kinetic energy causes Deadpool's landing to inflict a Stun effect on enemies in the blast radius.",
    bonuses: ['Stun Effect'],
  },
  'DEADPOOL DPS|HELA': {
    grade: 'B',
    confirmed: true,
    title: '"Hel-Yeah, Honey"',
    description:
      'When teaming up with Hela, BOTH the Desert Eagles and Katanas can be upgraded one extra time.',
    bonuses: ['Extra Upgrade'],
  },
  'DEADPOOL SUP|GAMBIT': {
    grade: 'B',
    confirmed: true,
    title: 'Gumbo Chimichangas',
    description:
      "When teaming up with Gambit, the kinetic energy causes Deadpool's landing to inflict a Stun effect on enemies in the blast radius.",
    bonuses: ['Stun Effect'],
  },
  'DEADPOOL SUP|HELA': {
    grade: 'A',
    confirmed: true,
    title: '"Hel-Yeah, Honey"',
    description:
      'When teaming up with Hela, BOTH the Desert Eagles and Katanas can be upgraded one extra time.',
    bonuses: ['Extra Upgrade'],
  },
  'DEADPOOL TANK|GAMBIT': {
    grade: 'A',
    confirmed: true,
    title: 'Gumbo Chimichangas',
    description:
      "When teaming up with Gambit, the kinetic energy causes Deadpool's landing to inflict a Stun effect on enemies in the blast radius.",
    bonuses: ['Stun Effect'],
  },
  'DEADPOOL TANK|HELA': {
    grade: 'S',
    confirmed: true,
    title: '"Hel-Yeah, Honey"',
    description:
      'When teaming up with Hela, BOTH the Desert Eagles and Katanas can be upgraded one extra time.',
    bonuses: ['Extra Upgrade'],
  },
  'DOCTOR STRANGE|HULK': {
    grade: 'S',
    confirmed: true,
    title: 'Gamma Maelstrom',
    description:
      "When teaming up with Hulk, releasing Gamma Maelstrom retains some energy, and stored Gamma energy doesn't decay over time.",
    bonuses: ['Energy Retention', 'No Energy Decay'],
  },
  'DOCTOR STRANGE|INVISIBLE WOMAN': {
    grade: 'A',
    confirmed: true,
    title: 'Psionic Vortex',
    description:
      'When teaming up with Invisible Woman, any damage dealt by Psionic Vortex provides proportional Bonus Health for Doctor Strange.',
    bonuses: ['Bonus Health'],
  },
  'ELSA BLOODSTONE|DEADPOOL DPS': {
    grade: 'S',
    confirmed: true,
    title: 'Loudmouth Mercs',
    description:
      "Living Bullet changes to special rounds that Taunt targets with Deadpool's chatter, while Slowing and damaging nearby enemies over time. After a timer, the bullet auto-recalls, healing Elsa based on the damage dealt while adding one extra gauge block to her Inherited Instinct passive cap. When teaming up with Deadpool (DPS), Deadpool breaks the fourth wall, significantly boosting Instinct acquisition rate.",
    bonuses: [
      'Special Rounds',
      'Taunt',
      'Slow',
      'Damage Over Time',
      'Auto-Recall',
      'Healing',
      'Extra Gauge Block',
      'Instinct Acquisition Boost',
    ],
  },
  'ELSA BLOODSTONE|DEADPOOL SUP': {
    grade: 'S',
    confirmed: true,
    title: 'Loudmouth Mercs',
    description:
      "Living Bullet changes to special rounds that Taunt targets with Deadpool's chatter, while Slowing and damaging nearby enemies over time. After a timer, the bullet auto-recalls, healing Elsa based on the damage dealt while adding one extra gauge block to her Inherited Instinct passive cap. When teaming up with Deadpool (SUPPORT), Deadpool breaks the fourth wall, significantly boosting Instinct acquisition rate.",
    bonuses: [
      'Special Rounds',
      'Taunt',
      'Slow',
      'Damage Over Time',
      'Auto-Recall',
      'Healing',
      'Extra Gauge Block',
      'Instinct Acquisition Boost',
    ],
  },
  'ELSA BLOODSTONE|DEADPOOL TANK': {
    grade: 'S',
    confirmed: true,
    title: 'Loudmouth Mercs',
    description:
      "Living Bullet changes to special rounds that Taunt targets with Deadpool's chatter, while Slowing and damaging nearby enemies over time. After a timer, the bullet auto-recalls, healing Elsa based on the damage dealt while adding one extra gauge block to her Inherited Instinct passive cap. When teaming up with Deadpool (TANK), Deadpool breaks the fourth wall, significantly boosting Instinct acquisition rate.",
    bonuses: [
      'Special Rounds',
      'Taunt',
      'Slow',
      'Damage Over Time',
      'Auto-Recall',
      'Healing',
      'Extra Gauge Block',
      'Instinct Acquisition Boost',
    ],
  },
  'ELSA BLOODSTONE|DEVIL DINOSAUR': {
    grade: 'SA',
    confirmed: true,
    title: 'Prehistoric Trap',
    description:
      'After deploying the Smoky Snare trap, Diablo will monitor the area. If enemies approach, Diablo Immobilizes and Damages them. He also releases a lethal gas, causing continuous area damage. When teaming up with Devil Dinosaur, Elsa can store and deploy two Smoky Snares.',
    bonuses: [
      'Smoky Snare Trap',
      'Immobilize',
      'Damage',
      'Lethal Gas',
      'Continuous Area Damage',
      'Two Traps',
    ],
  },
  'EMMA FROST|LUNA SNOW': {
    grade: 'B',
    confirmed: true,
    title: 'Iced Out Diamond',
    description:
      'When teaming up with Luna Snow, entering Diamond Form imbues all damaging abilities with a Slow effect. Telepathic Pulse will also inflict a Slow effect.',
    bonuses: ['Slow Effect'],
  },
  'EMMA FROST|MANTIS': {
    grade: 'B',
    confirmed: true,
    title: 'Spirit Breaker',
    description:
      'When teaming up with Mantis, shattering a sentience grants one-time Bonus Health while simultaneously reducing the cooldown of Psychic Spear.',
    bonuses: ['Bonus Health', 'Cooldown Reduction'],
  },
  'GAMBIT|JUBILEE': {
    grade: 'SA',
    confirmed: true,
    title: 'Sparkling Staff',
    description:
      'Twirl your firework-energy enhanced bo staff. The radiating firework sparks provide healing to nearby allies. Concurrently, the staff deals damage to close-range enemies, and the rapid spinning blocks incoming damage from most projectiles. When teaming up with Jubilee, both Bayou Bash and Big Easy Impact gain an additional Continuous Healing aura.',
    bonuses: ['Firework Staff', 'Ally Healing', 'Projectile Block', 'Continuous Healing Aura'],
  },
  'GAMBIT|MAGNETO': {
    grade: 'S',
    confirmed: true,
    title: 'Favorable Odds',
    description:
      'Throw two magnetic playing cards forward. Upon hitting the environment or a character, the cards magnetically repel and unfurl, spinning in place for a duration. They heal allies they hit, while damaging and Launching enemies. When teaming up with Magneto, after the duration ends, the magnetic poles of the cards reverse. They violently slam back together and explode, providing an extra burst of healing to allies and damage to enemies.',
    bonuses: [
      'Magnetic Cards',
      'Ally Healing',
      'Enemy Launch',
      'Magnetic Reversal',
      'Explosion',
      'Burst Healing',
    ],
  },
  'GROOT|JEFF': {
    grade: 'B',
    confirmed: true,
    title: 'Bubble Buddies',
    description:
      'When teaming up with Jeff the Land Shark, the healing effect inside the bubble is enhanced, and any excess healing converts into Bonus Health.',
    bonuses: ['Enhanced Healing', 'Bonus Health Conversion'],
  },
  'GROOT|MANTIS': {
    grade: 'B',
    confirmed: true,
    title: 'Wild Wall',
    description:
      'When teaming up with Mantis, the Wild Wall evolves after providing a certain amount of healing, increasing its healing.',
    bonuses: ['Healing Evolution'],
  },
  'HAWKEYE|CLOAK & DAGGER': {
    grade: 'A',
    confirmed: true,
    title: 'Moonlit Slash',
    description:
      'Upgrade Crescent Slash to Moonlit Slash, projecting a radiant slash outward. It heals and boosts healing for allies, while damaging enemies and applying Vulnerability. When teaming up with Cloak & Dagger, Moonlit Slash can be chained into a three-hit combo, firing off three consecutive sweeping light blades.',
    bonuses: ['Healing Boost', 'Vulnerability', 'Three-Hit Combo'],
  },
  'HAWKEYE|PSYLOCKE': {
    grade: 'SA',
    confirmed: true,
    title: 'Senbonzakura Strike',
    description:
      'Upgrade Blast Arrow to Psionic Arrow. While drawn, Hawkeye can continuously bank extra Psionic Arrows. Releasing the bowstring fires all accumulated arrows forward simultaneously. When teaming up with Psylocke, the nocking speed for each Psionic Arrow is significantly quickened, and they explode upon hitting enemies or the environment.',
    bonuses: ['Arrow Bank', 'Quickened Nocking', 'Explosive Arrows'],
  },
  'HELA|NAMOR': {
    grade: 'A',
    confirmed: true,
    title: 'Deep Wrath',
    description:
      "Whenever Hela participates in a KO, an Undead Monstro spawns at the fallen enemy's position. While an Undead Monstro is present, casting Piercing Night will command the Monstro to spit a Nightsword Thorn at the nearest enemy. When teaming up with Namor, each attack during Goddess of Death spawns an Undead Monstro at the point of impact.",
    bonuses: ['Undead Monstro', 'Auto-Target Thorn', 'Extra Spawns'],
  },
  'HELA|VENOM': {
    grade: 'A',
    confirmed: true,
    title: 'Hel Tendrils',
    description:
      "Replace Soul Drainer with Hel Tendrils. Upon hit, tendrils pull nearby enemies toward the impact point and links them, Slowing enemies that try to escape. When teaming up with Venom, Piercing Night fires a dense volley of symbiote-infused Nightsword Thorns. Each direct Nightsword Thorn hit restores a portion of Hela's Health.",
    bonuses: ['Enemy Pull', 'Slow', 'Symbiote Thorns', 'Self-Heal'],
  },
  'HUMAN TORCH|JUBILEE': {
    grade: 'A',
    confirmed: true,
    title: 'Fiery Sparks',
    description:
      'Passively detect enemies in the immediate vicinity and launch tracking Firework Sparks to chip away their health. When teaming up with Jubilee, successfully landing a Firework Spark on an enemy grants Human Torch Bonus Health.',
    bonuses: ['Tracking Sparks', 'Bonus Health on Hit'],
  },
  'HUMAN TORCH|STORM': {
    grade: 'SA',
    confirmed: true,
    title: 'Storming Ignition',
    description:
      'Unleash a storm-driven blaze of fire forward, generating a persistent Fire Vortex upon impact that continuously damages and pulls in enemies. When teaming up with Storm, her Omega Hurricane ignites into a Burning Hurricane if it crosses a Flame Tornado. Furthermore, any Omega Hurricane, Jeff-Nado, or Burning Hurricane that sweeps across a Flame Field left by Human Torch will instantly generate a new Flame Tornado.',
    bonuses: [
      'Fire Vortex',
      'Burning Hurricane',
      'Flame Tornado Generation',
      'Continuous Damage',
      'Pull Effect',
    ],
  },
  'INVISIBLE WOMAN|HUMAN TORCH': {
    grade: 'SA',
    confirmed: true,
    title: 'United Siblings',
    description:
      'Generate a Flame Shield for a targeted ally that blocks incoming damage while providing a Continuous Healing aura to everyone nearby. Projectiles from teammates shot through the Flame Shield receive a Damage Boost. Enemies that pass through the shield are Slowed. When teaming up with Human Torch, the Flame Shield boasts a larger radius and heavily increased shield value.',
    bonuses: [
      'Flame Shield',
      'Continuous Healing',
      'Damage Boost',
      'Slow',
      'Larger Radius',
      'Increased Shield Value',
    ],
  },
  'INVISIBLE WOMAN|MISTER FANTASTIC': {
    grade: 'B',
    confirmed: true,
    title: 'First Family',
    description:
      'Invisible Woman and surrounding allies enter Invisible state, gaining healing and a Speed Boost. The effect ends if they take damage or the duration expires. Disengaging from combat for a duration will reenter the Invisible state. When teaming up with Mister Fantastic, the healing and Speed Boost effects are enhanced, and the Invisible state duration is increased.',
    bonuses: [
      'Invisible State',
      'Healing',
      'Speed Boost',
      'Enhanced Effects',
      'Increased Duration',
    ],
  },
  'IRON FIST|THE THING': {
    grade: 'A',
    confirmed: true,
    title: 'Iron & Stone',
    description:
      'Unleash a powerful uppercut to Launch Up enemies. When teaming up with The Thing, unleashing the uppercut can be chained directly into a sweeping leg sweep for a follow-up attack.',
    bonuses: ['Uppercut', 'Launch Up', 'Leg Sweep Combo'],
  },
  'IRON FIST|WHITE FOX': {
    grade: 'B',
    confirmed: true,
    title: 'Kumiho Palm',
    description:
      'Hitting an enemy with Yat Jee Chung Kuen provides a burst of healing to nearby allies. When teaming up with White Fox, the lock-on distance for Yat Jee Chung Kuen is significantly increased.',
    bonuses: ['Burst Healing', 'Increased Lock-on Distance'],
  },
  'IRON MAN|BRUCE BANNER': {
    grade: 'SA',
    confirmed: true,
    title: 'Gamma Charge',
    description:
      'Upgrade Armor Overdrive to Gamma Overdrive. In this State, Iron Man gains a Gamma Shield and can fire stronger Repulsor Blasts and Unibeams. When teaming up with Hulk, releasing Invincible Pulse Cannon generates a Gamma Shield and heavily infuses the blast, creating a Gamma Pulse Cannon. Its radiation creates a damage increase while the projectile flies.',
    bonuses: ['Gamma Shield', 'Stronger Blasts', 'Gamma Pulse Cannon', 'Radiation Damage Increase'],
  },
  'IRON MAN|THOR': {
    grade: 'B',
    confirmed: true,
    title: 'Thunder Overdrive',
    description:
      "Enhance Unibeam both in and out of Armor Overdrive. When fired, a ring of volatile lightning energy forms, dealing bonus damage to enemies caught near the beam's edge. When teaming up with Thor, Armor Overdrive cooldown is massively reduced.",
    bonuses: ['Lightning Ring', 'Bonus Edge Damage', 'Massively Reduced Cooldown'],
  },
  'JEFF|DEADPOOL DPS': {
    grade: 'A',
    confirmed: true,
    title: "Mr. Pool's Interdimensional Toy Box",
    description:
      'Gain a new ability to spit out a Deadpool Plushie. The plushie continuously Taunts nearby enemies while spraying a healing mist onto surrounding allies. When teaming up with Deadpool (DPS), the Deadpool Plushie asserts a much stronger Taunt while concurrently damaging enemies caught in its radius.',
    bonuses: ['Deadpool Plushie', 'Taunt', 'Healing Mist', 'Stronger Taunt', 'Radius Damage'],
  },
  'JEFF|DEADPOOL SUP': {
    grade: 'A',
    confirmed: true,
    title: "Mr. Pool's Interdimensional Toy Box",
    description:
      'Gain a new ability to spit out a Deadpool Plushie. The plushie continuously Taunts nearby enemies while spraying a healing mist onto surrounding allies. When teaming up with Deadpool (SUPPORT), the Deadpool Plushie asserts a much stronger Taunt while concurrently damaging enemies caught in its radius.',
    bonuses: ['Deadpool Plushie', 'Taunt', 'Healing Mist', 'Stronger Taunt', 'Radius Damage'],
  },
  'JEFF|DEADPOOL TANK': {
    grade: 'A',
    confirmed: true,
    title: "Mr. Pool's Interdimensional Toy Box",
    description:
      'Gain a new ability to spit out a Deadpool Plushie. The plushie continuously Taunts nearby enemies while spraying a healing mist onto surrounding allies. When teaming up with Deadpool (TANK), the Deadpool Plushie asserts a much stronger Taunt while concurrently damaging enemies caught in its radius.',
    bonuses: ['Deadpool Plushie', 'Taunt', 'Healing Mist', 'Stronger Taunt', 'Radius Damage'],
  },
  'JEFF|VENOM': {
    grade: 'A',
    confirmed: true,
    title: 'Guardian of the Deep',
    description:
      'Shoot out healing tendrils; linked allies receive Continuous Healing, and excess healing is converted into Bonus Health. When teaming up with Venom, symbiote tendrils can also lash out at nearby enemies within range, inflicting continuous damage.',
    bonuses: [
      'Continuous Healing',
      'Bonus Health Conversion',
      'Symbiote Lash',
      'Continuous Damage',
    ],
  },
  'JUBILEE|BLADE': {
    grade: 'SA',
    confirmed: true,
    title: 'Vampiric Kin',
    description:
      'Deploy a Vampiric Field. Allies standing within the field gain Life Steal when attacking enemies. When teaming up with Blade, allies inside the field receive an additional Continuous Healing effect.',
    bonuses: ['Vampiric Field', 'Life Steal', 'Continuous Healing'],
  },
  'JUBILEE|THE HOOD': {
    grade: 'A',
    confirmed: true,
    title: 'Hellfire Sparks',
    description:
      'When Attack Speed is enhanced, Energy Plasmoids transform into a hit-scan attack that grants self-healing on hit and is capable of dealing critical hits. When teaming up with The Hood, the Void Magic Mark is never cleared, allowing her to indefinitely sustain the hit-scan attack form.',
    bonuses: ['Hit-Scan Attack', 'Self-Healing', 'Critical Hits', 'Indefinite Sustain'],
  },
  'LOKI|HELA': {
    grade: 'SA',
    confirmed: true,
    title: "Villain's Illusion",
    description:
      "Gain a new ability to target fallen heroes (friend or foe), letting Loki assume their form for a set time (cannot cast their Ultimate Ability). When teaming up with Hela, Loki's transformation lasts slightly longer. Furthermore, taking lethal damage while transformed or in his Ultimate Ability state will merely revert him back to Loki with some Health, preventing a KO.",
    bonuses: ['Extended Transformation', 'Death Prevention', 'Health Restore'],
  },
  'LOKI|MANTIS': {
    grade: 'A',
    confirmed: true,
    title: 'Vibrant Vitality',
    description:
      "Regeneration Domain provides a Damage Boost effect to allies within range; the Runestone triggers a psychic catalysis, expanding the domain's radius. When teaming up with Mantis, deploying Regeneration Domain emits a shockwave of nature energy that damages enemies within the radius and slightly Launches them up.",
    bonuses: ['Damage Boost', 'Expanded Radius', 'Nature Shockwave'],
  },
  'LUNA SNOW|ADAM WARLOCK': {
    grade: 'S',
    confirmed: true,
    title: 'Duality Dance',
    description:
      'Cast Soul Bond to tether all characters within range. Attacking tethered enemies or healing linked allies restores your Health. When teaming up with Adam Warlock, scoring critical hits with Light & Dark Ice reduces the cooldowns of Absolute Zero and Ice Arts.',
    bonuses: ['Soul Bond', 'Health Restore', 'Cooldown Reduction'],
  },
  'LUNA SNOW|WHITE FOX': {
    grade: 'SA',
    confirmed: true,
    title: 'Atlas Bond',
    description:
      'Unleash a spirit fox forward that Charms enemies while healing any allies in its path. Activating the ability instantly cleanses all negative status effects on Luna Snow. When teaming up with White Fox, the spirit fox automatically returns after reaching its maximum distance, and the self-cleanse is retained.',
    bonuses: ['Charm', 'Healing', 'Self-Cleanse', 'Fox Return'],
  },
  'MAGIK|DOCTOR STRANGE': {
    grade: 'SA',
    confirmed: true,
    title: 'Chain of Cyttorak',
    description:
      'Chain of Cyttorak can tether two enemies simultaneously, dragging both targets to the same location. When teaming up with Doctor Strange, Chain of Cyttorak can tether multiple enemies at once, pulling the entire group to a singular point.',
    bonuses: ['Dual Tether', 'Multi-Target Pull'],
  },
  'MAGIK|HOOD': {
    grade: 'B',
    confirmed: true,
    title: 'Void Pentagram',
    description:
      'Casting Stepping Discs within a Void Magic Circle refunds energy, and each use of Stepping Discs summons a Limbo Demon. When teaming up with The Hood, the summoned Limbo Demons have heavily increased Health and a wider attack range.',
    bonuses: ['Energy Refund', 'Limbo Demon', 'Increased Health', 'Wider Range'],
  },
  'MAGNETO|EMMA FROST': {
    grade: 'SA',
    confirmed: true,
    title: 'Magnetic Resonance',
    description:
      "Cast a magnetic projection that mimics Magneto's movement and ability casts perfectly from the enemy's perspective. When teaming up with Emma Frost, the magnetic projection receives a massive Health bump and will persist indefinitely unless destroyed or manually recalled.",
    bonuses: [
      'Magnetic Projection',
      'Mimic Abilities',
      'Massive Health Bump',
      'Indefinite Duration',
    ],
  },
  'MAGNETO|SCARLET WITCH': {
    grade: 'SA',
    confirmed: true,
    title: 'Metallic Chaos',
    description:
      'Swing a colossal Chaos Greatsword forward to inflict damage. When teaming up with Scarlet Witch, Mag-Cannon transforms into a charged ability that consumes his passive energy bar. For every tick of energy burned, a Chaos Greatsword is fired, damaging enemies.',
    bonuses: [
      'Chaos Greatsword',
      'Mag-Cannon Transformation',
      'Energy Consumption',
      'Multiple Swords',
    ],
  },
  'MANTIS|ADAM WARLOCK': {
    grade: 'B',
    confirmed: true,
    title: 'Vitality Pact',
    description:
      "Upon defeat, Mantis can freely move as a soul, healing nearby allies, and reforge her body at a chosen spot. After using Natural Anger, the effect of Nature's Favor is enhanced, increasing the amount of healing provided. When teaming up with Adam Warlock, her soul state can forge Soul Bond with nearby teammates, granting Healing Over Time and distributing damage taken across the bond.",
    bonuses: ['Soul State Healing', 'Soul Bond', 'Healing Over Time', 'Damage Distribution'],
  },
  'MANTIS|STAR-LORD': {
    grade: 'S',
    confirmed: true,
    title: 'Star Blossom',
    description:
      'Recasting Healing Flower on a teammate with the effect enhances and spreads the healing aura. When teaming up with Star-Lord, using Healing Flower on any teammate instantly triggers the enhanced spell field and healing effect.',
    bonuses: ['Enhanced Healing Aura', 'Instant Trigger'],
  },
  'MISTER FANTASTIC|ROCKET RACCOON': {
    grade: 'A',
    confirmed: true,
    title: 'Fantastic Amplifier',
    description:
      "Equips the Fantastic Amplifier. For the duration, Mister Fantastic's maximum Elasticity is increased, and he can actively enter Inflation State. When teaming up with Rocket Raccoon, Brainiac Bounce Launches hit enemies.",
    bonuses: ['Increased Elasticity', 'Inflation State', 'Brainiac Bounce Launches'],
  },
  'MISTER FANTASTIC|THE THING': {
    grade: 'A',
    confirmed: true,
    title: "Clobberin' Research Dept.",
    description:
      'In brawler stance, Stretch Punch becomes a charged ability, firing a forward Brawling Punch. Hitting an enemy grants Bonus Health scaling with damage, and a full charge Launches hit enemies. When teaming up with The Thing, while in the brawling stance, Distended Grip also becomes a charged ability, slamming down a Distended Hammer. Hitting enemies grants Bonus Health based on damage, and also Launches enemies at full charge.',
    bonuses: ['Brawling Punch', 'Bonus Health', 'Launch', 'Distended Hammer', 'Charged Abilities'],
  },
  'MOON KNIGHT|CLOAK & DAGGER': {
    grade: 'SA',
    confirmed: true,
    title: 'Luminous Moon',
    description:
      'Enter Phased state and dash forward. Upon concluding, emit a Light Energy Healing Wave that heals Moon Knight and nearby allies. When teaming up with Cloak & Dagger, the Phased state duration is extended, the dash distance increases, and the Light Energy Healing Wave boasts a larger radius and stronger healing output.',
    bonuses: ['Phased State', 'Dash', 'Healing Wave', 'Extended Duration', 'Increased Range'],
  },
  'MOON KNIGHT|ELSA BLOODSTONE': {
    grade: 'SA',
    confirmed: true,
    title: 'Blood Moon',
    description:
      "Deploy an Ankh Trap. Upon triggering, an Ankh materializes at the location, while summoning a single Talon of Khonshu to Launch enemies toward the trap's center. When teaming up with Elsa Bloodstone, triggering the trap summons multiple Talons of Khonshu to bombard the area.",
    bonuses: ['Ankh Trap', 'Enemy Launch', 'Multiple Talons'],
  },
  'NAMOR|BRUCE BANNER': {
    grade: 'S',
    confirmed: true,
    title: 'Gamma Monstro',
    description:
      'Summon an extra Gamma Monstro that continuously damages the nearest enemy. Upon landing critical hits, the Gamma Monstro gains increased Attack Speed. Hitting an enemy with Wrath of the Seven Seas prompts it to fire a powerful beam. When teaming up with Hulk, casting Blessing of the Deep creates a water barrier infused with Gamma energy. Standing inside accelerates the Gamma Monstro cooldown and grants it a Damage Boost.',
    bonuses: [
      'Extra Monstro',
      'Increased Attack Speed',
      'Powerful Beam',
      'Gamma Barrier',
      'Cooldown Acceleration',
      'Damage Boost',
    ],
  },
  'NAMOR|LUNA SNOW': {
    grade: 'SA',
    confirmed: true,
    title: 'Chilling Charisma',
    description:
      'Gain a new ability to summon a Frost Tide forward. The wave damages, Pushes Back, and inflicts a Slow on all enemies hit. When teaming up with Luna Snow, the Frost Tide gains 1 charge and crashes down upon reaching its maximum range, dealing area damage and Slowing enemies caught near the endpoint.',
    bonuses: ['Frost Tide', 'Push Back', 'Slow', 'Extra Charge', 'AoE Crash'],
  },
  'PENI PARKER|BLACK PANTHER': {
    grade: 'B',
    confirmed: true,
    title: 'Vibranium Mech',
    description:
      'When teaming up with Black Panther, the Vibranium Shield is expanded, and its active time increased.',
    bonuses: ['Expanded Shield', 'Increased Duration'],
  },
  'PENI PARKER|ROCKET RACCOON': {
    grade: 'B',
    confirmed: true,
    title: 'Rocket Network',
    description:
      "When teaming up with Rocket Raccoon, the Armored Spider-Nest passively regenerates its own Health. Furthermore, Rocket's B.R.B. will generate Cyber-Webs, and spawn both Spider-Drones and Arachno-Mines.",
    bonuses: ['Health Regeneration', 'Extra Turrets'],
  },
  'PHOENIX|HELA': {
    grade: 'SA',
    confirmed: true,
    title: 'Circle of Life',
    description:
      'Psionic Detonation is replaced by Phoenix Netherfire, applying a Telekinetic Mark to the targeted location. Upon hitting, it triggers an initial small explosion that briefly Stuns enemies, followed by two larger explosions that apply a Healing Reduction effect. Every single blast inflicts Sparks onto the enemies. When teaming up with Hela, every blast in the sequence applies multiple stacks of Sparks to enemies caught within.',
    bonuses: [
      'Phoenix Netherfire',
      'Telekinetic Mark',
      'Stun',
      'Healing Reduction',
      'Sparks',
      'Multiple Spark Stacks',
    ],
  },
  'PHOENIX|ROGUE': {
    grade: 'B',
    confirmed: true,
    title: 'Telekinetic Beatdown',
    description:
      'Fire a telekinetic shockwave forward. If it lands, the Phoenix Force rushes the enemy and delivers a powerful punch. If there are other targets nearby, the Phoenix Force rapidly blinks between them to strike them as well, inflicting a Spark on each victim while healing Phoenix. When teaming up with Rogue, add an additional Spark stack, gain more healing, and increase the maximum number of strikes.',
    bonuses: [
      'Telekinetic Shockwave',
      'Phoenix Force Rush',
      'Spark Infliction',
      'Self-Healing',
      'Extra Spark Stack',
      'Increased Strikes',
    ],
  },
  'PSYLOCKE|CLOAK & DAGGER': {
    grade: 'A',
    confirmed: true,
    title: 'Light & Dark Darts',
    description:
      "Unleash a ring of Light Darts in all directions that damage enemies and restore Psylocke's Health upon impact, leaving behind a Shadow Domain. Staying inside the domain for a short time will re-enter Stealth. When teaming up with Cloak & Dagger, the radius of the Shadow Domain expands, and each time re-entering Stealth, the Light Darts are fired in all directions again.",
    bonuses: [
      'Light Darts',
      'Health Restore',
      'Shadow Domain',
      'Stealth Re-entry',
      'Expanded Radius',
      'Repeated Darts',
    ],
  },
  'PSYLOCKE|EMMA FROST': {
    grade: 'S',
    confirmed: true,
    title: 'Mental Projection',
    description:
      "Create an illusory projection that automatically dashes forward to use Psi-Blade Dash, while Psylocke enters Stealth. If Psylocke attacks, the illusion mimics her strikes. When teaming up with Emma Frost, Psylocke's mental powers are elevated, allowing her to reactivate the ability to instantly swap places with her illusion.",
    bonuses: ['Illusory Projection', 'Psi-Blade Dash', 'Stealth', 'Mimic Strikes', 'Instant Swap'],
  },
  'ROCKET RACCOON|GROOT': {
    grade: 'A',
    confirmed: true,
    title: 'Planet X Pals',
    description:
      "Convert Bombard Mode to launch Thorny Spores. Upon impact, they deal continuous damage to enemies within the radius while healing and granting Bonus Health to allies. When teaming up with Groot, Rocket can ride on Groot's shoulders, and the active duration of the Thorny Spores field is extended.",
    bonuses: ['Thorny Spores', 'Mounted Position', 'Extended Duration'],
  },
  'ROCKET RACCOON|SQUIRREL GIRL': {
    grade: 'B',
    confirmed: true,
    title: 'Mammalian Bond',
    description:
      'Toss out a scattered batch of augmented Vitality Acorns. Acorns that hit the floor can be collected. Whether struck directly or picked up, teammates receive a burst of healing and global cooldown reduction. When teaming up with Squirrel Girl, the maximum charge count for this ability is increased.',
    bonuses: ['Vitality Acorns', 'Burst Healing', 'Cooldown Reduction', 'Extra Charges'],
  },
  'ROGUE|GAMBIT': {
    grade: 'SA',
    confirmed: true,
    title: 'Mr. & Mrs. X',
    description:
      'After activation, every attack triggers a kinetic explosion, dealing area damage to surrounding enemies while simultaneously healing nearby allies. When teaming up with Gambit, Rogue remains permanently locked in the "Hearts as One" state.',
    bonuses: ['Kinetic Explosion', 'Area Damage', 'Ally Healing', 'Permanent Hearts as One State'],
  },
  'ROGUE|MAGNETO': {
    grade: 'A',
    confirmed: true,
    title: 'Explosive Entanglement',
    description:
      "Defensive Stance is fortified. Activating the ability expands a magnetic field, drastically boosting the Damage Reduction ratio of Defensive Stance. Furthermore, all damage absorbed by the field is converted directly into damage for Southern Brawl. When teaming up with Magneto, Southern Brawl Knocks back enemies. Extra damage is dealt if they're propelled into a wall.",
    bonuses: [
      'Fortified Defensive Stance',
      'Magnetic Field',
      'Damage Reduction',
      'Damage Conversion',
      'Knockback',
      'Wall Damage',
    ],
  },
  'SCARLET WITCH|DOCTOR STRANGE': {
    grade: 'B',
    confirmed: true,
    title: 'Sorcerers Supreme',
    description:
      "Chthonian Burst is replaced with Mystic Burst upon activation. Hold down the attack button to unleash a rapid, relentless salvo of magical missiles in the target direction. When teaming up with Doctor Strange, Scarlet Witch's maximum total Chaos Energy pool increases, and Chaos Control generates energy much faster when attacking.",
    bonuses: ['Mystic Burst', 'Increased Energy Pool', 'Faster Energy Generation'],
  },
  'SCARLET WITCH|JUBILEE': {
    grade: 'B',
    confirmed: true,
    title: 'Hex Fireworks',
    description:
      'Infuse firework energy into the Dark Seal forcefield, turning it into a Plasmoid Seal, allowing for a secondary blast. After expanding the Plasmoid Seal, pressing the key again while it persists will detonate the fireworks, dealing damage and inflicting Vulnerability. When teaming up with Jubilee, Scarlet Witch receives constant healing from the firework energy while using Mystic Projection.',
    bonuses: ['Plasmoid Seal', 'Secondary Blast', 'Vulnerability', 'Constant Healing'],
  },
  'SPIDER-MAN|PENI PARKER': {
    grade: 'SA',
    confirmed: true,
    title: 'Parker Power-Up',
    description:
      "Peni Parker whips up a Sticky Spider-Bomb for Spider-Man! Prime it, then toss it before the timer's up for a blast that damages nearby enemies and attaches a Spider-Tracer to them. If not thrown in time, it explodes on Spider-Man, recharging all Web-Cluster shots. When teaming up with Peni Parker, Spider-Tracers applied by Web-Cluster are upgraded. Detonating these upgraded marks generates Bonus Health for Spider-Man.",
    bonuses: ['Sticky Spider-Bomb', 'Spider-Tracer', 'Web-Cluster Recharge', 'Bonus Health'],
  },
  'SPIDER-MAN|VENOM': {
    grade: 'A',
    confirmed: true,
    title: 'Symbiote Bond',
    description:
      'Venom shares a part of his symbiote with Spider-Man, activating their symbiote abilities. Spider-Man can convert the symbiotes into explosive spikes that inflict harm on nearby enemies and relentlessly drive them back. When teaming up with Venom, this triggers additional Touch of Klyntar tendrils that continuously tether and damage enemies on top of the base effect.',
    bonuses: ['Symbiote Abilities', 'Explosive Spikes', 'Klyntar Tendrils', 'Continuous Tether'],
  },
  'SQUIRREL GIRL|IRON MAN': {
    grade: 'A',
    confirmed: true,
    title: 'Squirrel Missile',
    description:
      "Gain the Squirrel Missile ability. Squirrel Girl directs a squirrel to ride Iron Man's nanotech glove as a homing missile. Upon hit, the squirrel flees just before a fiery explosion. When teaming up with Iron Man, using Squirrel Blockade simultaneously fires a Squirrel Missile.",
    bonuses: ['Homing Missile', 'Fiery Explosion', 'Simultaneous Fire'],
  },
  'SQUIRREL GIRL|SPIDER-MAN': {
    grade: 'A',
    confirmed: true,
    title: 'ESU Alumnus',
    description:
      'Spider-Man gives Squirrel Girl a web bomb. She can launch it to unleash an explosion upon contact with the environment or an enemy, briefly Slowing and damaging enemies caught in the blast. When teaming up with Spider-Man, Squirrel Girl receives more Web Fluid. After throwing Webbed Acorn, viscous web fluid coats the ground alongside the explosion, leaving behind a sticky Web Area. Enemies within suffer a continuous Slow that scales into a Stun if they linger too long.',
    bonuses: ['Web Bomb', 'Slow', 'Web Area', 'Stun'],
  },
  'STAR-LORD|ADAM WARLOCK': {
    grade: 'SA',
    confirmed: true,
    title: 'Star-Soul',
    description:
      "Gain a new ability to place a Telekinetic Beacon. You can teleport back to the location where the beacon is deployed from anywhere on the map. Upon defeat, Star-Lord will cocoon and respawn at the Telekinetic Beacon's coordinates. When teaming up with Adam Warlock, every time Star-Lord participates in a KO, Telekinetic Beacon cooldown is reduced.",
    bonuses: ['Telekinetic Beacon', 'Map Teleport', 'Cocoon Respawn', 'Cooldown Reduction on KO'],
  },
  'STAR-LORD|GROOT': {
    grade: 'A',
    confirmed: true,
    title: 'Flora Munitions',
    description:
      'Gain a new ability to toss Twisted Thorn Seeds forward. Upon landing, they rapidly Sprout and take root, generating Thorn Snares around the area. Enemies stepping on a snare take damage and suffer a Root effect. When teaming up with Groot, the number of Thorn Snares deployed increases, and the damage dealt when an enemy steps on them is boosted.',
    bonuses: ['Thorn Seeds', 'Thorn Snares', 'Root Effect', 'Increased Snares', 'Boosted Damage'],
  },
  'STORM|JEFF': {
    grade: 'SA',
    confirmed: true,
    title: 'Jaws of Fate',
    description:
      'Unleash a torrential downpour that continuously heals both herself and her teammates. When teaming up with Jeff the Land Shark, casting Omega Hurricane allows Jeff to swim inside the cyclone, generating a localized Jeff-nado.',
    bonuses: ['Continuous Healing', 'Jeff-nado Synergy'],
  },
  'STORM|THOR': {
    grade: 'A',
    confirmed: true,
    title: 'Gods of Thunder',
    description:
      'Upgrade Wind Blade into a hitscan lightning beam that detonates upon striking a target. When teaming up with Thor, Bolt Rush becomes Chain Lightning, allowing it to bounce from foe to foe.',
    bonuses: ['Hitscan Beam', 'Chain Lightning', 'Bouncing Damage'],
  },
  'THE PUNISHER|DAREDEVIL': {
    grade: 'A',
    confirmed: true,
    title: 'Bestial Hunt',
    description:
      'Shoot piercing bullets that carry a Damage Boost effect. When teaming up with Daredevil, the bullets break enemy summoned walls and shields more quickly.',
    bonuses: ['Piercing Bullets', 'Damage Boost', 'Shield Break'],
  },
  'THE PUNISHER|ROCKET RACCOON': {
    grade: 'SA',
    confirmed: true,
    title: 'Ammo Overload',
    description:
      "Throw an Ammo Overload Device in the target direction. Upon entering the device's range, receive Faster Firing. When teaming up with Rocket Raccoon, the device grants Infinite Ammo and Faster Firing.",
    bonuses: ['Faster Firing', 'Infinite Ammo'],
  },
  'THE THING|HUMAN TORCH': {
    grade: 'SA',
    confirmed: true,
    title: 'Two-In-One',
    description:
      "Enter an enhanced state upon activation. For the duration, The Thing's fists are violently engulfed in flames. Every Rocky Jab deals splash damage, and every Stone Haymaker creates an explosion, dealing damage in a frontal cone. When teaming up with Human Torch, Human Torch can lift The Thing into the air and slam him down, dealing damage and Stun to enemies. The Thing then automatically enters his flaming enhanced state upon landing.",
    bonuses: [
      'Flaming Fists',
      'Splash Damage',
      'Explosion Damage',
      'Lift & Slam',
      'Stun',
      'Auto-Enhanced State',
    ],
  },
  'THE THING|INVISIBLE WOMAN': {
    grade: 'A',
    confirmed: true,
    title: 'Unbreakable Forces',
    description:
      'Generate a layer of Psionic Armor upon activation, granting Bonus Health scaling off currently missing Health. When teaming up Invisible Woman, the Psionic Armor is fortified. While active, every time The Thing takes a set amount of damage, the armor pulses out a wave of area healing for allies. Furthermore, the conversion ratio for missing Health into Bonus Health is increased.',
    bonuses: [
      'Psionic Armor',
      'Bonus Health',
      'Fortified Armor',
      'Area Healing Wave',
      'Increased Conversion Ratio',
    ],
  },
  'THOR|ANGELA': {
    grade: 'A',
    confirmed: true,
    title: 'Divine Armory',
    description:
      "Hurl a Thunder Spear that restores Thorforce for each enemy struck. Afterward, Thor can leap to the spear's explosion point, dealing a second wave of damage to all enemies within range. When teaming up with Angela, leaping to the Thunder Spear grants Bonus Health.",
    bonuses: ['Thorforce Restore', 'Leap Damage', 'Bonus Health'],
  },
  'THOR|HELA': {
    grade: 'SA',
    confirmed: true,
    title: 'Ragnarok Rebirth',
    description:
      'Receiving fatal damage prevents immediate defeat, Thor gains a decaying pool of Bonus Health. If he participates in a KO during this time, he resurrects and recovers a small amount of Health. When teaming up with Hela, if either of them participates in a KO, Thor instantly revives, restoring Health equal to his remaining Bonus Health and gaining a Continuous Healing effect.',
    bonuses: ['Death Prevention', 'Instant Revive', 'Continuous Healing', 'Health Restoration'],
  },
  'ULTRON|IRON MAN': {
    grade: 'B',
    confirmed: true,
    title: 'Stark Protocol',
    description:
      'Upgrade Encephalo-Ray to Nano-Ray, firing multiple damaging nano-projectiles forward. When teaming up with Iron Man, Imperative: Firewall fires powerful homing missiles at enemies in range, causing area damage.',
    bonuses: ['Nano-Ray', 'Multiple Projectiles', 'Homing Missiles', 'Area Damage'],
  },
  'ULTRON|PENI PARKER': {
    grade: 'S',
    confirmed: true,
    title: 'SP//DR SYNC',
    description:
      'Apply Imperative: Patch to all allies. When teaming up with Peni Parker, Imperative: Firewall applies to all Drones, allowing the ability effects to be triggered multiple times simultaneously.',
    bonuses: ['Imperative: Patch', 'Drone Synergy', 'Multiple Triggers'],
  },
  'VENOM|BLADE': {
    grade: 'B',
    confirmed: true,
    title: 'Blood Leech',
    description:
      "Cellular Corrosion new effect: while tethered to enemies, continuously siphon health from every linked target, restoring Venom's Health. When teaming up with Blade, Venom gains a burst of one-time healing when using certain specific abilities.",
    bonuses: ['Health Siphon', 'Burst Healing'],
  },
  'VENOM|PHOENIX': {
    grade: 'SA',
    confirmed: true,
    title: 'Abyssal Flames',
    description:
      "Ignite the symbiote with Phoenix Flames for a duration, replacing Dark Predation with a sweeping Avian Claw frontal slash. When teaming up with Phoenix, Venom's Phoenix Force is enhanced: every Avian Claw applies a Spark. Upon reaching three stacks, the Sparks detonate.",
    bonuses: ['Phoenix Flames', 'Avian Claw', 'Spark Stacks', 'Detonation'],
  },
  'WHITE FOX|BLACK CAT': {
    grade: 'A',
    confirmed: true,
    title: 'Lucky Loan',
    description:
      'White Fox receives an Orb of Life from Black Cat. Upon use, it recovers Spirit Tail Energy and converts life energy into Nine-Tailed Aura that shoots out in all directions. This automatically tracks nearby allies and enemies, granting Speed and Healing to allies while damaging and Slowing enemies. When teaming up with Black Cat, using the Orb triggers a state where Spirit Tail Energy is no longer consumed for a duration, allowing free use of Spectral Surge and Fox Form Awakening.',
    bonuses: [
      'Orb of Life',
      'Spirit Tail Energy Recovery',
      'Nine-Tailed Aura',
      'Ally Speed & Healing',
      'Enemy Damage & Slow',
      'Free Energy Usage',
    ],
  },
  'WINTER SOLDIER|ELSA BLOODSTONE': {
    grade: 'S',
    confirmed: true,
    title: 'Expert Instinct',
    description:
      "Securing or participating in a KO grants a stack of Culling Instinct. Each stack reduces the cooldowns of Winter Soldier's other abilities. Stacks are lost upon defeat. When teaming up with Elsa Bloodstone, the Bonus Health generated by Ceaseless Charge is increased.",
    bonuses: ['Culling Instinct Stacks', 'Cooldown Reduction', 'Increased Bonus Health'],
  },
  'WINTER SOLDIER|THE PUNISHER': {
    grade: 'A',
    confirmed: true,
    title: 'Timeless Veterans',
    description:
      'Unlocks the Burst Spike ability. Using the bionic arm emits forward electricity, dealing damage and Knocking Back enemies. When teaming up with The Punisher, the electric burst applies a Grounded effect and Knocks Back enemies even further.',
    bonuses: ['Burst Spike', 'Electricity Damage', 'Grounded Effect', 'Enhanced Knockback'],
  },
  'WOLVERINE|CYCLOPS': {
    grade: 'A',
    confirmed: true,
    title: 'Blast Slash',
    description:
      'Activation extends the attack range of Savage Claw and Berserk Claw Strike. Vicious Rampage is replaced with Kinetic Claws, granting a brief forward lunge that unleashes a flurry of slashes around. When teaming up with Cyclops, Blast Slash is permanently active.',
    bonuses: [
      'Extended Range',
      'Kinetic Claws',
      'Forward Lunge',
      'Flurry of Slashes',
      'Permanently Active',
    ],
  },
  'WOLVERINE|GAMBIT': {
    grade: 'SA',
    confirmed: true,
    title: 'Pair of Threes',
    description:
      'Upon activation, Wolverine receives Kinetic Enhancement, gaining increased Movement Speed and a Jump Boost. Attacking enemies applies Kinetic Particles that detonate after a short delay for bonus damage. The effect lasts for duration. When teaming up with Gambit, Wolverine receives Continuous Healing for the entire duration of the ability.',
    bonuses: [
      'Kinetic Enhancement',
      'Movement Speed',
      'Jump Boost',
      'Kinetic Particles',
      'Continuous Healing',
    ],
  },
}
