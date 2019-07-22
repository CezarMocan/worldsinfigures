import * as d3GeoProjection from "d3-geo-projection"
import * as d3 from 'd3'

// d3GeoProjection['geoEquirectangular'] = d3.geoEquirectangular

const getProjectionDisplayNameFromKey = (k) => {
    return k.substring(3).split("").reduce((acc, val, index) => {
        if (val == val.toUpperCase() && val >= 'A' && index != 0) return acc + ' ' + val
        return acc + val
    }, "")
}

let allProjectionIds = Object.keys(d3GeoProjection)
allProjectionIds.push('geoEquirectangular')

const viableProjectionIds = allProjectionIds.filter(id => id.indexOf('Raw') == -1)
                                            // .filter(id => !!(d3GeoProjection[id]().invert))

console.log('Viable projection ids: ', viableProjectionIds)

export const projectionsList = viableProjectionIds.map(p => {
    return {
        id: p,
        displayName: getProjectionDisplayNameFromKey(p),
        fn: d3GeoProjection[p] || d3[p]
    }
})

export const projectionsMap = projectionsList.reduce((acc, val) => {
    acc[val.id] = val
    return acc
}, {})