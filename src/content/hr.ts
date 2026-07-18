import type { BottleKind, BottleStorage, FussyCheckOutcome } from '../domain/types'

export const bottleKindLabels: Record<BottleKind, string> = {
  powderFormula: 'Praškasta formula',
  readyFormula: 'Gotova formula',
  expressedMilk: 'Izdojeno mlijeko',
}

export const bottleStorageLabels: Record<BottleStorage, string> = {
  fresh: 'Svježe pripremljena',
  fridge: 'Odmah stavljena u hladnjak',
  roomTemperature: 'Ostavljena izvan hladnjaka',
}

export const outcomeLabels: Record<FussyCheckOutcome, string> = {
  notIt: 'Provjereno — nije to',
  helped: 'Pomoglo je',
  skipped: 'Preskoči',
}

export const navigationLabels = {
  today: 'Danas',
  history: 'Povijest',
  settings: 'Postavke',
} as const
