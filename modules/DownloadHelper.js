import JSZip from 'jszip'
import { saveAs } from 'file-saver'

const blobToBase64 = (blob) => {
  return new Promise((res, rej) => {
    var reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onloadend = () => { res(reader.result) }
  })
}

const dataURLToBase64 = (dataURL) => dataURL.replace(/^data:image\/(png|jpg);base64,/, "");

export const downloadContent = (filename, href) => {
    let element = document.createElement('a')

    element.href = href
    element.download = filename      
    element.style.display = 'none';

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

export const createAndDownloadText = (filename, text) => {
    const href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
    downloadContent(filename, href)
}

export const createAndDownloadSvg = (filename, svgRef) => {
    const data = '<?xml version="1.0" encoding="utf-8"?>' + svgRef.outerHTML        
    var svgBlob = new Blob([data], { type:"image/svg+xml;charset=utf-8" })
    var svgUrl = URL.createObjectURL(svgBlob);
    downloadContent(filename, svgUrl)
}
export const createAndDownloadImage = (filename, canvasRef) => {
    const dataUrl = canvasRef.toDataURL('image/png')
    downloadContent(filename, dataUrl)
}

export const Zipper = class Zipper {
  constructor() {
    this._zipper = new JSZip()    
    this._png = this._zipper.folder('png')
    this._svg = this._zipper.folder('svg')
  }
  async addImage(filename, canvasRef, svgRef) {
    let dataBase64
    if (canvasRef) {
      dataBase64 = dataURLToBase64(canvasRef.toDataURL('image/png'))
      this._png.file(`${filename}.png`, dataBase64, { base64: true })
    }
    if (svgRef) {
      const data = '<?xml version="1.0" encoding="utf-8"?>' + svgRef.outerHTML        
      var svgBlob = new Blob([data], { type:"image/svg+xml;charset=utf-8" })
      dataBase64 = await blobToBase64(svgBlob)
      // this._svg.file(`${filename}.svg`, dataBase64, { base64: true })
    }   
  }
  async complete() {
    console.log('completing...')
    return new Promise((res, rej) => {
      this._zipper.generateAsync({ type:"blob" }).then((blob) => {
        const fileName = `${new Date().getTime()}.zip`
        saveAs(blob, fileName);
        res()
      })
    })
  }
}