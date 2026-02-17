export type Industry =
  | 'kontor'
  | 'lager'
  | 'restaurang'
  | 'bygg'
  | 'stad'
  | 'transport'

export const industryLabels: Record<Industry, string> = {
  kontor: 'Kontor',
  lager: 'Lager',
  restaurang: 'Restaurang',
  bygg: 'Bygg',
  stad: 'Städ',
  transport: 'Transport'
}

type RiskTemplate = {
  title: string
  area?: string
  likelihood: 'sällan'|'ibland'|'ofta'
  consequence: 'litet'|'allvarligt'|'mycket_allvarligt'
  measure: string
}

type ActionTemplate = { description: string, ownerHint?: string }

export function templates(industry: Industry): { risks: RiskTemplate[], actions: ActionTemplate[] } {
  const common: RiskTemplate[] = [
    { title:'Fall/snubblerisk', area:'Allmänna ytor', likelihood:'ibland', consequence:'allvarligt', measure:'Håll gångar fria, åtgärda kablar/mattkanter.' },
    { title:'Ergonomi (stillasittande / lyft)', area:'Arbetsplats', likelihood:'ofta', consequence:'allvarligt', measure:'Ställ in arbetsplats, pauser, hjälpmedel vid lyft.' },
    { title:'Stress/hög arbetsbelastning', area:'Organisation', likelihood:'ibland', consequence:'allvarligt', measure:'Planera bemanning, tydliga prioriteringar, uppföljning.' },
    { title:'Brand/utrymning', area:'Lokaler', likelihood:'sällan', consequence:'mycket_allvarligt', measure:'Utrymningsvägar fria, brandsläckare kontrollerade, övning.' },
  ]
  const by: Record<Industry, RiskTemplate[]> = {
    kontor: [
      { title:'Skärm/arbetsställning', area:'Kontor', likelihood:'ofta', consequence:'litet', measure:'Skärmhöjd, stol, belysning, ergonomigenomgång.' },
    ],
    lager: [
      { title:'Truck/påkörningsrisk', area:'Lager', likelihood:'ibland', consequence:'mycket_allvarligt', measure:'Separera gång/truck, utbildning internt, hastighet.' },
      { title:'Tunga lyft', area:'Lager', likelihood:'ofta', consequence:'allvarligt', measure:'Lyfthjälpmedel, rutiner, två-personers lyft vid behov.' },
    ],
    restaurang: [
      { title:'Brännskador', area:'Kök', likelihood:'ibland', consequence:'allvarligt', measure:'Skyddsutrustning, rutiner för heta ytor, tydlig märkning.' },
      { title:'Skärskador', area:'Kök', likelihood:'ibland', consequence:'allvarligt', measure:'Säkra knivrutiner, rätt verktyg, förvaring.' },
    ],
    bygg: [
      { title:'Fall från höjd', area:'Byggplats', likelihood:'ibland', consequence:'mycket_allvarligt', measure:'Fallskydd, räcken, kontroll före arbete.' },
      { title:'Maskiner/verktyg', area:'Byggplats', likelihood:'ibland', consequence:'allvarligt', measure:'Skydd, kontroller, avspärrningar.' },
    ],
    stad: [
      { title:'Kemikalier/rengöringsmedel', area:'Städ', likelihood:'ibland', consequence:'allvarligt', measure:'Förvaring, handskar, tydliga instruktioner, ventilation.' },
      { title:'Arbete ensam', area:'Organisation', likelihood:'ibland', consequence:'allvarligt', measure:'Incheckning, rutiner, kontaktvägar.' },
    ],
    transport: [
      { title:'Trafikrisk', area:'Väg', likelihood:'ibland', consequence:'mycket_allvarligt', measure:'Planera rutter, vila, rutiner för säker körning.' },
      { title:'Lastsäkring', area:'Lastning', likelihood:'ibland', consequence:'allvarligt', measure:'Kontrollista, rätt utrustning, dubbelkontroll.' },
    ],
  }

  const actions: ActionTemplate[] = [
    { description:'Gör en enkel skyddsrond (10 min) och registrera eventuella risker.' },
    { description:'Säkerställ att utrymningsvägar är fria och att släckare är på plats.' },
    { description:'Planera nästa SAM-uppföljning (datum + ansvarig).' },
  ]

  return { risks: [...common, ...(by[industry] ?? [])], actions }
}
