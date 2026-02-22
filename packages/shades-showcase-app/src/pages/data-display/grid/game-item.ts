export const itemRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const
export type ItemRarity = (typeof itemRarities)[number]

export const itemTypes = ['weapon', 'armor', 'potion', 'scroll', 'ring', 'amulet'] as const
export type ItemType = (typeof itemTypes)[number]

export class GameItem {
  declare id: number
  declare name: string
  declare type: ItemType
  declare rarity: ItemRarity
  declare level: number
  declare weight: number
  declare isQuestItem: boolean
  declare discoveredAt: Date
}

const pickRandom = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

const weaponBases = [
  'Longsword',
  'Battleaxe',
  'Warhammer',
  'Dagger',
  'Greatsword',
  'Crossbow',
  'Staff',
  'Mace',
  'Halberd',
  'Rapier',
  'Scimitar',
  'Shortbow',
  'Longbow',
  'Flail',
  'Spear',
  'Claymore',
  'Katana',
  'Morningstar',
] as const

const armorBases = [
  'Plate Armor',
  'Chain Mail',
  'Leather Armor',
  'Shield',
  'Helmet',
  'Gauntlets',
  'Boots',
  'Breastplate',
  'Robe',
  'Cloak',
  'Bracers',
  'Greaves',
  'Pauldrons',
  'Crown',
] as const

const potionEffects = [
  'Health',
  'Mana',
  'Stamina',
  'Strength',
  'Agility',
  'Invisibility',
  'Fire Resistance',
  'Frost Resistance',
  'Giant Strength',
  'Speed',
  'Regeneration',
  'Fortitude',
] as const

const scrollSpells = [
  'Fireball',
  'Lightning Bolt',
  'Teleportation',
  'Identify',
  'Town Portal',
  'Resurrection',
  'Enchantment',
  'Summoning',
  'Blizzard',
  'Chain Lightning',
  'Mass Heal',
  'Meteor',
] as const

const jewelryEffects = [
  'Protection',
  'Power',
  'Vitality',
  'Wisdom',
  'Evasion',
  'Fire',
  'Ice',
  'Shadows',
  'the Arcane',
  'Fortitude',
  'the Stars',
  'Warding',
] as const

const prefixes = [
  'Ancient',
  'Blessed',
  'Cursed',
  'Enchanted',
  'Infernal',
  'Holy',
  'Shadow',
  'Frost',
  'Storm',
  'Blood',
  'Void',
  'Arcane',
  'Divine',
  'Runic',
  'Ethereal',
  'Savage',
  'Exalted',
  'Spectral',
] as const

const suffixes = [
  'of the Phoenix',
  'of Shadows',
  'of the Dragon',
  'of the Undead',
  'of Light',
  'of Darkness',
  'of the Storm',
  'of the Ancients',
  'of Might',
  'of Wisdom',
  'of the Wolf',
  'of Fury',
  'of the Forgotten',
  'of Blight',
  'of Eternity',
] as const

const potionContainers = ['Potion', 'Elixir', 'Flask', 'Vial', 'Draught'] as const

const generateItemName = (type: ItemType, rarity: ItemRarity): string => {
  const usePrefix = rarity !== 'common' && Math.random() > 0.3
  const useSuffix = (rarity === 'epic' || rarity === 'legendary') && Math.random() > 0.3
  const prefix = usePrefix ? `${pickRandom(prefixes)} ` : ''
  const suffix = useSuffix ? ` ${pickRandom(suffixes)}` : ''

  switch (type) {
    case 'weapon':
      return `${prefix}${pickRandom(weaponBases)}${suffix}`
    case 'armor':
      return `${prefix}${pickRandom(armorBases)}${suffix}`
    case 'potion':
      return `${pickRandom(potionContainers)} of ${pickRandom(potionEffects)}`
    case 'scroll':
      return `Scroll of ${pickRandom(scrollSpells)}`
    case 'ring':
      return `${prefix}Ring of ${pickRandom(jewelryEffects)}`
    case 'amulet':
      return `${prefix}Amulet of ${pickRandom(jewelryEffects)}`
    default:
      throw new Error('Unknown item type')
  }
}

const weightRanges: Record<ItemType, [min: number, max: number]> = {
  weapon: [2, 15],
  armor: [5, 50],
  potion: [0.5, 2],
  scroll: [0.1, 0.5],
  ring: [0.05, 0.3],
  amulet: [0.1, 0.5],
}

let nextId = 0

export const createGameItem = (): GameItem => {
  const type = pickRandom(itemTypes)
  const rarity = pickRandom(itemRarities)
  const [minWeight, maxWeight] = weightRanges[type]
  const discoveredAt = new Date()
  discoveredAt.setDate(discoveredAt.getDate() - Math.floor(Math.random() * 365))
  discoveredAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

  return {
    id: nextId++,
    name: generateItemName(type, rarity),
    type,
    rarity,
    level: Math.floor(Math.random() * 60) + 1,
    weight: Math.round((minWeight + Math.random() * (maxWeight - minWeight)) * 100) / 100,
    isQuestItem: Math.random() < 0.1,
    discoveredAt,
  }
}
