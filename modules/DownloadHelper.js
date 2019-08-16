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
