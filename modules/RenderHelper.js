export const getImageData = (image, context, canvasWidth, canvasHeight) => {
    const dx = image.width
    const dy = image.height    
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.save()
    context.drawImage(image, 0, 0, dx, dy, 0, 0, canvasWidth, canvasHeight)
    context.restore()
    const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight).data
    return imageData
}

export const projectImageData = (sourceData, projection, context, canvasWidth, canvasHeight) => {
    const target = context.createImageData(canvasWidth, canvasHeight)
    let targetData = target.data

    for (var y = 0, i = -1; y <= canvasHeight; y += 1) {
        for (var x = 0; x <= canvasWidth; x += 1) {
          const _x = x, _y = y
          var p = projection.invert([_x, _y])
          if (!p) continue
          let λ = p[0], φ = p[1];

          i = y * (canvasWidth) * 4 + x * 4 - 1

        //   λ = ((λ + 36000000180) % 360) - 180
        //   φ = ((φ + 36000000090) % 180) - 90

          if (λ > 180 || λ < -180 || φ > 90 || φ < -90) { 
            targetData[++i] = 128;
            targetData[++i] = 128;
            targetData[++i] = 128;
            targetData[++i] = 255;  
            continue
          }
          var q = (((90 - φ) / 180 * canvasHeight | 0) * canvasWidth + ((180 + λ) / 360 * canvasWidth | 0) << 2)
            targetData[++i] = sourceData[q];
            targetData[++i] = sourceData[++q];
            targetData[++i] = sourceData[++q];
            targetData[++i] = 255;  
        }
      }        

      return target
}