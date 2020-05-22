import { propertiesExcludedFromExport } from '../data/LayerData'

export const prepareLayersForExport = (layers) => {
  return Object.keys(layers).reduce((acc, k) => {
    const layer = layers[k]
    acc[k] = {}
    Object.keys(layer).forEach(lk => {
      if (propertiesExcludedFromExport.indexOf(lk) != -1) return
      acc[k][lk] = layer[lk]
    })
    return acc
  }, {})
}