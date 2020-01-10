import cloneDeep from 'clone-deep'

export const eachCoordMap = (object, transformFn) => {
  if (Array.isArray(object) && object.length == 2 && (typeof object[0] == 'number') && (typeof object[1] == 'number')) {
      transformFn(object)
      return
  }

  let children = null
  if (typeof object == 'object' && object != null) children = Object.values(object)
  else if (Array.isArray(object)) children = object

  if (!children) return

  children.forEach(c => eachCoordMap(c, transformFn))
}

export const duplicateOnHemispheres = (geojsonObject) => {
  let topHalf = cloneDeep(geojsonObject)
  let bottomHalf = cloneDeep(geojsonObject)

  eachCoordMap(topHalf, (pos) => {
      pos[0] = pos[0] / 2.0;
      pos[1] = pos[1] / 2.0 + 45
  })

  eachCoordMap(bottomHalf, (pos) => {
      pos[0] = pos[0] / 2.0;
      pos[1] = pos[1] / 2.0 - 45
  })

  let topAndBottom = cloneDeep(geojsonObject)
  if (topHalf.features) {
      topAndBottom.features = topHalf.features.concat(bottomHalf.features)
  } else if (topHalf.coordinates) {
      topAndBottom.coordinates = topHalf.coordinates.concat(bottomHalf.coordinates)
  }

  return topAndBottom
}
