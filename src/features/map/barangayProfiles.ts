import type { BoundaryFeature } from './boundaryData.ts'

// Short descriptions adapted from the user's supplied list of all 70 barangays.
// Match current barangay numbers, not PCODE suffixes or historical name aliases.
// Names/numbers checked against PSA PSGC on 2026-10-27 (updates through 2026 Q3).
// See BARANGAYS.md for sources and intentional display-name formatting.
export const BARANGAY_PROFILES: Readonly<Record<number, { name: string; formerNumbers?: readonly number[]; description: string }>> = {
  1: { name: "Em's Barrio", description: 'An established residential community associated with Bicol University’s College of Engineering and College of Industrial Technology, serving families and students.' },
  2: { name: "Em's Barrio South", description: 'A residential neighborhood in the southern portion of Em’s Barrio, with access to schools, services, and establishments in surrounding areas.' },
  3: { name: "Em's Barrio East", description: 'A small residential community in eastern Em’s Barrio, forming part of the older neighborhood network around Legazpi’s Albay district.' },
  4: { name: 'Sagpon', description: 'An established poblacion community connected to Legazpi’s traditional residential areas, with nearby access to commercial establishments and public services.' },
  5: { name: 'Sagmin', description: 'A small residential community within the Sagpon poblacion group, forming part of the city’s older urban neighborhoods.' },
  6: { name: 'Bañadero', description: 'An established poblacion community in the historical Sagpon area, with residential neighborhoods closely connected to the nearby Albay district.' },
  7: { name: 'Baño', description: 'A small barangay near the Albay district, forming part of the city’s traditional residential setting with access to surrounding urban services.' },
  8: { name: 'Bagumbayan', description: 'An established community near Legazpi’s older residential and commercial districts, connected to nearby roads, businesses, schools, and public services.' },
  9: { name: 'Pinaric', description: 'A small residential barangay near Legazpi’s older Albay communities, with neighborhood services and a safe living environment among its local priorities.' },
  10: { name: 'Cabugao', description: 'A compact residential barangay near Maoyod and the Ilawod communities, connected to services and establishments in surrounding areas.' },
  11: { name: 'Maoyod', formerNumbers: [10, 11], description: 'An established poblacion neighborhood near the Ilawod communities, with nearby public facilities and local establishments serving its residential community.' },
  12: { name: 'Tula-tula', description: 'An established residential community near Maoyod and Ilawod, connected to the commercial and social activities of Legazpi’s older district.' },
  13: { name: 'Ilawod West', description: 'A compact poblacion barangay in the western section of the Ilawod community, forming part of the city’s older residential area.' },
  14: { name: 'Ilawod', description: 'The central barangay of the Ilawod group, connected to neighboring residential areas and the public and commercial services of the older city district.' },
  15: { name: 'Ilawod East', description: 'A poblacion community in eastern Ilawod, contributing to the residential life of the older Albay district and its surrounding urban neighborhoods.' },
  16: { name: 'Kawit-East Washington Drive', description: 'An urban residential barangay encompassing the Kawit and East Washington Drive areas, connected to nearby commercial establishments and public facilities.' },
  17: { name: 'Rizal Street, Ilawod', description: 'An established neighborhood along the Rizal Street area within Ilawod, connected to other parts of Legazpi’s populated district.' },
  18: { name: 'Cabagñan West', description: 'The western section of the Cabagñan community, forming an established residential neighborhood connected to Cabagñan and Cabagñan East.' },
  19: { name: 'Cabagñan', description: 'The central portion of the Cabagñan area, between its western and eastern barangays, with residential neighborhoods connected to surrounding urban services.' },
  20: { name: 'Cabagñan East', description: 'A small residential barangay in the eastern section of Cabagñan, closely connected to the neighboring communities of this three-barangay group.' },
  21: { name: 'Binanuahan West', description: 'A compact residential barangay in western Binanuahan, sharing close connections with nearby communities and local services in Legazpi’s established urban area.' },
  22: { name: 'Binanuahan East', description: 'A residential barangay in eastern Binanuahan, forming an established community with Binanuahan West within the older urban area of Legazpi.' },
  23: { name: 'Imperial Court Subdivision', description: 'A residential barangay named for its subdivision, forming part of Legazpi’s developed neighborhood network and primarily serving as a community for residents.' },
  24: { name: 'Rizal Street', description: 'An urban barangay associated with Rizal Street, separate from Rizal Street, Ilawod, with connections to nearby commercial establishments and public services.' },
  25: { name: 'Lapu-lapu', description: 'A residential barangay named after the Filipino historical figure, surrounded by established communities and connected to the city’s urban facilities.' },
  26: { name: 'Dinagaan', description: 'A small barangay in Legazpi’s developed central area, offering a compact community setting among other established urban neighborhoods.' },
  27: { name: 'Victory Village South', description: 'A residential barangay in the southern part of Victory Village, contributing to Legazpi’s neighborhood life and connecting with surrounding urban areas.' },
  28: { name: 'Victory Village North', description: 'An established residential barangay in northern Victory Village, closely connected to Victory Village South within Legazpi’s older developed district.' },
  29: { name: 'Sabang', description: 'A coastal community near Legazpi’s central waterfront, where coastal road improvements, flood protection, drainage, and access to public services are important.' },
  30: { name: 'Pigcale', description: 'A small coastal barangay in Legazpi’s populated waterfront area, where coastal management, flood protection, and disaster preparedness are important local concerns.' },
  31: { name: 'Centro-Baybay', description: 'A barangay in Legazpi’s central coastal district, where residential and business activities meet within the city’s older commercial and waterfront environment.' },
  32: { name: 'San Roque', formerNumbers: [66], description: 'An established urban community in Legazpi’s coastal district, associated with flood-control facilities, coastal development, and disaster preparedness efforts.' },
  33: { name: 'PNR-Peñaranda Street-Iraya', description: 'An urban barangay associated with the Philippine National Railways area, Peñaranda Street, and Iraya, with residential communities near important city facilities.' },
  34: { name: 'Oro Site-Magallanes Street', description: 'An urban barangay near Legazpi’s older commercial center, connecting the Oro Site and Magallanes Street areas with establishments, transport routes, and services.' },
  35: { name: 'Tinago', description: 'One of Legazpi’s smallest barangays, located within the established central urban area and maintaining a distinct administrative community within the city.' },
  36: { name: 'Kapantawan', description: 'A small urban barangay near Legazpi’s central coastal section, distinguished by its compact size and proximity to the waterfront.' },
  37: { name: 'Bitano', description: 'A commercial and transportation hub, home to SM City Legazpi, combining residential neighborhoods with shopping, transport facilities, and local businesses.' },
  38: { name: 'Gogon', formerNumbers: [54], description: 'An established urban barangay with a large residential community, connected to nearby schools, businesses, and roads serving Legazpi’s central districts.' },
  39: { name: 'Bonot', description: 'A residential community in Legazpi’s northern urban area, near the coastal section, Gogon, and Rawis, with connections to commercial and educational establishments.' },
  40: { name: 'Cruzada', formerNumbers: [52], description: 'A large urban barangay in Legazpi’s developed northern district, supporting housing, public services, and local economic activities among neighboring communities.' },
  41: { name: 'Bogtong', formerNumbers: [45], description: 'A mainly residential barangay in northern Legazpi, where developed neighborhoods meet hilly surroundings and environmental safety is an important community consideration.' },
  42: { name: 'Rawis', formerNumbers: [65], description: 'A major residential and educational area, home to the University of Santo Tomas–Legazpi, with nearby coastal surroundings and commercial activities.' },
  43: { name: 'Tamaoyan', formerNumbers: [67], description: 'A northern barangay near Rawis and Pawa, with residential surroundings and gently uneven land between developed neighborhoods and less densely settled communities.' },
  44: { name: 'Pawa', formerNumbers: [61], description: 'A northern barangay with residential communities and open land, linking Legazpi’s developed urban districts with communities closer to Mayon Volcano.' },
  45: { name: 'Dita', formerNumbers: [51], description: 'A residential barangay in northern Legazpi near Pawa and San Joaquin, forming part of the network connecting the city center with northern settlements.' },
  46: { name: 'San Joaquin', formerNumbers: [64], description: 'A primarily residential community in northern Legazpi near Dita and Arimbay, connecting established urban neighborhoods with the surrounding northern areas.' },
  47: { name: 'Arimbay', description: 'A coastal barangay in northern Legazpi along Albay Gulf, with nearby coral reef habitats and an important connection to coastal resources and livelihoods.' },
  48: { name: 'Bagong Abre', formerNumbers: [42], description: 'A northern barangay near Arimbay and Bigaa, with residential settlements and moderately uneven terrain connecting Legazpi’s urban and northeastern communities.' },
  49: { name: 'Bigaa', formerNumbers: [44], description: 'A populated northern barangay with residential development near the coast, associated with marine resources including coral reef and seagrass habitats.' },
  50: { name: 'Padang', formerNumbers: [60], description: 'A community near Mayon’s foothills, remembered for the effects of Typhoon Reming in 2006 and the importance of disaster awareness and community resilience.' },
  51: { name: 'Buyuan', formerNumbers: [49], description: 'A northern barangay near Mayon’s slopes, with agricultural surroundings, residential settlements, and natural water resources including springs.' },
  52: { name: 'Matanag', description: 'A rural barangay along Mayon’s lower slopes, with elevated terrain and agricultural surroundings where environmental conditions and volcanic hazards influence land use.' },
  53: { name: 'Bonga', formerNumbers: [48], description: 'A spacious barangay near Mayon’s foothills, associated with agricultural landscapes and natural resources, including spring water sources in northern Legazpi.' },
  54: { name: 'Mabinit', formerNumbers: [59], description: 'A barangay near Mayon’s foothills, characterized by elevated terrain, agricultural land, and natural resources including springs identified in city environmental records.' },
  55: { name: 'Estanza', formerNumbers: [53], description: 'A developing southern barangay with residential settlements and rolling or hilly terrain, where residential growth and environmental management are important considerations.' },
  56: { name: 'Taysan', formerNumbers: [68], description: 'A major residential barangay in southern Legazpi, identified for future urban expansion and important to housing, public facilities, and the city’s long-term development.' },
  57: { name: 'Dap-dap', formerNumbers: [69], description: 'A coastal barangay connected to Legazpi Boulevard, with Albay Gulf views and a role in seaside recreation, tourism, transportation, and waterfront development.' },
  58: { name: 'Buragwis', description: 'An established residential barangay in southern Legazpi near Dap-dap and the older Albay communities, linking central neighborhoods with the city’s southern districts.' },
  59: { name: 'Puro', formerNumbers: [63], description: 'A coastal barangay connected to Legazpi Boulevard, with Albay Gulf and Mayon views that support recreation, sightseeing, and the city’s waterfront life.' },
  60: { name: 'Lamba', description: 'A southern coastal barangay connected to the Legazpi Boulevard extension, with seagrass and mangrove habitats supporting coastal protection, fishing, and tourism activities.' },
  61: { name: 'Maslog', formerNumbers: [58], description: 'A southern coastal barangay with mangroves, seagrass beds, and fishing areas, where coastal conservation and sustainable livelihoods are important to the community.' },
  62: { name: 'Homapon', formerNumbers: [55], description: 'A coastal community associated with fishing, brackish water fishponds, mangroves, and seagrass, contributing to Legazpi’s coastal livelihoods and environmental management.' },
  63: { name: 'Mariawa', formerNumbers: [56], description: 'A southern barangay with a relatively large land area, rural surroundings, and uneven terrain, offering a spacious residential and agricultural setting.' },
  64: { name: 'Bagacay', formerNumbers: [41], description: 'A coastal barangay with fishponds, mangrove forests, and seagrass habitats, where fishing-related livelihoods and environmental conservation shape the community’s background.' },
  65: { name: 'Imalnod', formerNumbers: [57], description: 'A southern barangay surrounded by Legazpi’s wider rural landscape, contributing to the area’s residential and agricultural character and connections to public services.' },
  66: { name: 'Banquerohan', formerNumbers: [43], description: 'A large southern barangay with residential communities and coastal resources, including mangroves, seagrass, and fishponds that support community development and coastal livelihoods.' },
  67: { name: 'Bariis', formerNumbers: [46], description: 'A rural barangay in southern upland Legazpi, with hilly and steep terrain where land management and access to services are important community concerns.' },
  68: { name: 'San Francisco', formerNumbers: [62], description: 'A southern coastal barangay with hilly terrain, mangrove forests, and traditional fishing areas that contribute to its rural and coastal identity.' },
  69: { name: 'Buenavista', formerNumbers: [47], description: 'A southern barangay with mountainous terrain, natural vegetation, mangroves, and seagrass, where environmental protection is an important community consideration.' },
  70: { name: 'Cagbacong', formerNumbers: [50], description: 'A spacious barangay in southernmost Legazpi, with mountainous and hilly terrain, rural communities, and priorities around agriculture, environmental management, and accessibility.' },
}

export function barangayProfile(feature: BoundaryFeature) {
  const number = Number(/^Bgy\.\s*(\d+)\s*-/i.exec(feature.properties.name)?.[1])
  const profile = BARANGAY_PROFILES[number]
  return profile ? { number, ...profile } : undefined
}

/** Former numbers are references from PSA census records, never selection IDs. */
export function barangayFormerNumberLabel(number: number): string {
  const numbers = BARANGAY_PROFILES[number]?.formerNumbers
  return numbers?.length ? ` (${numbers.join(' & ')})` : ''
}

/** Current number first; parenthesized numbers retain the documented old reference. */
export function barangayAddress(number: number, includeCity = false): string | undefined {
  const profile = BARANGAY_PROFILES[number]
  return profile ? `Barangay ${number} ${profile.name}${barangayFormerNumberLabel(number)}${includeCity ? ', Legazpi City' : ''}` : undefined
}
