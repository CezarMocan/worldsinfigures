// download-worker.js
importScripts('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');

// Helper function to convert dataURL to base64
function dataURLToBase64(dataURL) {
  return dataURL.split(',')[1];
}

// Helper function to convert blob to dataURL (for SVG handling)
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

class WorkerZipper {
  constructor() {
    this._zipper = new JSZip();
    this._png = this._zipper.folder('png');
    this._svg = this._zipper.folder('svg');
  }

  init() {
    this._zipper = new JSZip();
    this._png = this._zipper.folder('png');
    this._svg = this._zipper.folder('svg');
  }

  clear() {
    delete this._zipper;
    delete this._png;
    delete this._svg;
  }

  async addImage(filename, imageData, type) {
    if (type === 'png') {
      // Handle PNG data
      if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
        // For data URLs (base64)
        const base64Data = dataURLToBase64(imageData);
        this._png.file(`${filename}.png`, base64Data, { base64: true });
      } else if (imageData instanceof Blob) {
        // For Blob objects
        this._png.file(`${filename}.png`, imageData);
      }
    } else if (type === 'svg') {
      // Handle SVG data
      if (typeof imageData === 'string') {
        if (imageData.startsWith('data:image/svg+xml;base64,')) {
          // It's already a data URL
          const base64Data = dataURLToBase64(imageData);
          this._svg.file(`${filename}.svg`, base64Data, { base64: true });
        } else if (imageData.startsWith('<svg') || imageData.startsWith('<?xml')) {
          // It's SVG markup
          const svgBlob = new Blob([imageData], { type: "image/svg+xml;charset=utf-8" });
          const dataURL = await blobToDataURL(svgBlob);
          const base64Data = dataURLToBase64(dataURL);
          this._svg.file(`${filename}.svg`, base64Data, { base64: true });
        }
      }
    }
  }

  async complete(archiveName) {
    archiveName = archiveName || new Date().getTime();
    const blob = await this._zipper.generateAsync({ 
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    }, (metadata) => {
      // Report compression progress
      self.postMessage({
        status: 'compression-progress',
        percentage: Math.round(metadata.percent)
      });
    });
    
    return blob;
  }
}

self.onmessage = async function(e) {
  const { images, archiveName = 'animation-export', pngItems = [], svgItems = [] } = e.data;
  
  try {
    const zipper = new WorkerZipper();
    zipper.init();
    
    // Process images array if provided (backward compatibility)
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const filename = `frame-${String(i).padStart(5, '0')}`;
        await zipper.addImage(filename, images[i], 'png');
        
        // Report progress back to main thread
        if (i % 10 === 0 || i === images.length - 1) {
          self.postMessage({
            status: 'progress',
            current: i + 1,
            total: images.length,
            percentage: Math.round(((i + 1) / images.length) * 100)
          });
        }
      }
    }
    
    // Process specific PNG items
    if (pngItems && pngItems.length > 0) {
      for (let i = 0; i < pngItems.length; i++) {
        const { filename, data } = pngItems[i];
        await zipper.addImage(filename, data, 'png');
        
        // Report progress
        if (i % 10 === 0 || i === pngItems.length - 1) {
          self.postMessage({
            status: 'progress-png',
            current: i + 1,
            total: pngItems.length,
            percentage: Math.round(((i + 1) / pngItems.length) * 100)
          });
        }
      }
    }
    
    // Process specific SVG items
    if (svgItems && svgItems.length > 0) {
      for (let i = 0; i < svgItems.length; i++) {
        const { filename, data } = svgItems[i];
        await zipper.addImage(filename, data, 'svg');
        
        // Report progress
        if (i % 10 === 0 || i === svgItems.length - 1) {
          self.postMessage({
            status: 'progress-svg',
            current: i + 1,
            total: svgItems.length,
            percentage: Math.round(((i + 1) / svgItems.length) * 100)
          });
        }
      }
    }
    
    // Start ZIP compression
    self.postMessage({ status: 'compressing' });
    const blob = await zipper.complete(archiveName);
    
    // Create object URL for the zip and send it back to the main thread
    const zipUrl = URL.createObjectURL(blob);
    self.postMessage({ 
      status: 'complete', 
      url: zipUrl,
      filename: `${archiveName}.zip`,
      size: blob.size 
    });
    
    // Clean up
    zipper.clear();
    
  } catch (error) {
    self.postMessage({ status: 'error', message: error.message });
  }
};