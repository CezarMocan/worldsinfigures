import JSZip from 'jszip'
import { saveAs } from 'file-saver'

const blobToDataURL = (blob) => {
  return new Promise((res, rej) => {
    var reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onloadend = () => { res(reader.result) }
  })
}

const dataURLToBase64 = (dataURL) => dataURL.replace(/^data:image\/(png|jpg|svg\+xml\;charset\=utf\-8);base64,/, "");

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
  init() {
    this._zipper = new JSZip()    
    this._png = this._zipper.folder('png')
    this._svg = this._zipper.folder('svg')    
  }
  clear() {
    delete this._zipper
    delete this._png
    delete this._svg
  }
  async addImage(filename, canvasRef, svgRef) {
    let dataBase64
    if (canvasRef) {
      const blob = await new Promise((res, rej) => { canvasRef.toBlob((blob) => { res(blob) }, 'image/png') })
      // dataBase64 = dataURLToBase64(canvasRef.toDataURL('image/png'))
      // this._png.file(`${filename}.png`, dataBase64, { base64: true })
      this._png.file(`${filename}.png`, blob)
    }
    if (svgRef) {
      const data = '<?xml version="1.0" encoding="utf-8"?>' + svgRef.outerHTML        
      var svgBlob = new Blob([data], { type:"image/svg+xml;charset=utf-8" })
      let dataURL = await blobToDataURL(svgBlob)
      dataBase64 = dataURLToBase64(dataURL)
      this._svg.file(`${filename}.svg`, dataBase64, { base64: true })
    }   
  }
  async complete(archiveName) {
    archiveName = (archiveName || new Date().getTime())
    console.log('completing...')
    return new Promise((res, rej) => {
      this._zipper.generateAsync({ type:"blob" }).then((blob) => {
        const fileName = `${archiveName}.zip`
        saveAs(blob, fileName);
        this.clear()
        // this.init()
        res()
      })
    })
  }
}