import * as d3GeoProjection from "d3-geo-projection"
import * as d3 from 'd3'

const getProjectionDisplayNameFromKey = (k) => {
    return k.substring(3).split("").reduce((acc, val, index) => {
        if (val == val.toUpperCase() && val >= 'A' && index != 0) return acc + ' ' + val
        return acc + val
    }, "")
}

let allProjectionIds = [
    'geoEquirectangular',
    'geoAlbers',
    'geoAlbersUsa',
    'geoAzimuthalEqualArea',
    'geoAzimuthalEquidistant',
    'geoConicConformal',
    'geoConicEqualArea',
    'geoConicEquidistant',
    'geoEqualEarth',
    'geoGnomonic',
    'geoMercator',
    'geoNaturalEarth1',
    'geoOrthographic',
    'geoStereographic',
    'geoTransverseMercator'    
]

Object.keys(d3GeoProjection).forEach(p => allProjectionIds.push(p))

const viableProjectionIds = allProjectionIds.filter(id => id.indexOf('Raw') == -1)

export const projectionsList = viableProjectionIds.map(p => {
    return {
        id: p,
        displayName: getProjectionDisplayNameFromKey(p),
        flagEmoji: '🇬🇷',
        genderEmoji: '👨',
        year: '100 C.E.',        
        fn: d3GeoProjection[p] || d3[p]
    }
})

export const projectionsMap = projectionsList.reduce((acc, val) => {
    acc[val.id] = val
    return acc
}, {})