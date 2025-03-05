import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import React, { useState, useEffect, useRef } from 'react';

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

// The Zipper class that works both in main thread and provides worker compatibility
export class Zipper {
  constructor() {
    this._zipper = new JSZip();
    this._png = this._zipper.folder('png');
    this._svg = this._zipper.folder('svg');
    this._worker = null;
    this._isUsingWorker = false;
    this._pngQueue = [];
    this._svgQueue = [];
    this._progressCallback = null;
    this._compressionCallback = null;
    this._errorCallback = null;
    this._completeCallback = null;
  }
  
  init() {
    if (!this._isUsingWorker) {
      this._zipper = new JSZip();
      this._png = this._zipper.folder('png');
      this._svg = this._zipper.folder('svg');
    }
    this._pngQueue = [];
    this._svgQueue = [];
  }
  
  clear() {
    if (this._worker) {
      this._worker.terminate();
      this._worker = null;
    }
    
    if (!this._isUsingWorker) {
      delete this._zipper;
      delete this._png;
      delete this._svg;
    }
    
    this._pngQueue = [];
    this._svgQueue = [];
    this._progressCallback = null;
    this._compressionCallback = null;
    this._errorCallback = null;
    this._completeCallback = null;
    this._isUsingWorker = false;
  }
  
  // Enable worker mode
  useWorker(workerPath = '/download-worker.js') {
    try {
      this._worker = new Worker(workerPath);
      this._isUsingWorker = true;
      
      this._worker.onmessage = (e) => {
        const { status, message, url, percentage, current, total, filename, size } = e.data;
        
        if (status === 'progress' || status === 'progress-png' || status === 'progress-svg') {
          if (this._progressCallback) {
            this._progressCallback(percentage, current, total, status);
          }
        } else if (status === 'compressing') {
          if (this._compressionCallback) {
            this._compressionCallback(0); // Initial compression progress
          }
        } else if (status === 'compression-progress') {
          if (this._compressionCallback) {
            this._compressionCallback(percentage);
          }
        } else if (status === 'complete') {
          if (this._completeCallback) {
            this._completeCallback(url, filename, size);
          }
        } else if (status === 'error') {
          if (this._errorCallback) {
            this._errorCallback(message);
          }
        }
      };
      
      return true;
    } catch (err) {
      console.error('Failed to initialize worker:', err);
      this._isUsingWorker = false;
      return false;
    }
  }
  
  // Set callback functions
  onProgress(callback) {
    this._progressCallback = callback;
    return this;
  }
  
  onCompression(callback) {
    this._compressionCallback = callback;
    return this;
  }
  
  onError(callback) {
    this._errorCallback = callback;
    return this;
  }
  
  onComplete(callback) {
    this._completeCallback = callback;
    return this;
  }
  
  // Add image to the archive (compatible with original API)
  async addImage(filename, canvasRef, svgRef) {
    if (this._isUsingWorker) {
      // In worker mode, we queue the items for later processing
      if (canvasRef) {
        const blob = await new Promise((res, rej) => { 
          canvasRef.toBlob((blob) => { res(blob) }, 'image/png') 
        });
        this._pngQueue.push({ filename, data: blob });
      }
      
      if (svgRef) {
        const data = '<?xml version="1.0" encoding="utf-8"?>' + svgRef.outerHTML;
        const svgBlob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
        const dataURL = await blobToDataURL(svgBlob);
        this._svgQueue.push({ filename, data: dataURL });
      }
    } else {
      // In main thread mode, we process directly as in the original
      if (canvasRef) {
        const blob = await new Promise((res, rej) => { 
          canvasRef.toBlob((blob) => { res(blob) }, 'image/png') 
        });
        this._png.file(`${filename}.png`, blob);
      }
      
      if (svgRef) {
        const data = '<?xml version="1.0" encoding="utf-8"?>' + svgRef.outerHTML;
        const svgBlob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
        const dataURL = await blobToDataURL(svgBlob);
        const dataBase64 = dataURLToBase64(dataURL);
        this._svg.file(`${filename}.svg`, dataBase64, { base64: true });
      }
    }
  }
  
  // Add PNG image data directly 
  addPngData(filename, data) {
    if (this._isUsingWorker) {
      this._pngQueue.push({ filename, data });
    } else {
      if (data instanceof Blob) {
        this._png.file(`${filename}.png`, data);
      } else if (typeof data === 'string' && data.startsWith('data:image/')) {
        const base64Data = dataURLToBase64(data);
        this._png.file(`${filename}.png`, base64Data, { base64: true });
      }
    }
    return this;
  }
  
  // Add SVG data directly
  addSvgData(filename, data) {
    if (this._isUsingWorker) {
      this._svgQueue.push({ filename, data });
    } else {
      if (typeof data === 'string') {
        if (data.startsWith('data:image/svg+xml;base64,')) {
          const base64Data = dataURLToBase64(data);
          this._svg.file(`${filename}.svg`, base64Data, { base64: true });
        } else if (data.startsWith('<svg') || data.startsWith('<?xml')) {
          const svgBlob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
          blobToDataURL(svgBlob).then(dataURL => {
            const base64Data = dataURLToBase64(dataURL);
            this._svg.file(`${filename}.svg`, base64Data, { base64: true });
          });
        }
      }
    }
    return this;
  }
  
  // Complete the archive and trigger download
  async complete(archiveName) {
    archiveName = archiveName || new Date().getTime();
    
    if (this._isUsingWorker) {
      // In worker mode, send all queued items to the worker
      console.log("Posting queues: ", this._pngQueue, this._svgQueue)
      this._worker.postMessage({
        archiveName,
        pngItems: this._pngQueue,
        svgItems: this._svgQueue
      });
      
      // Return a promise that will be resolved by the onComplete callback
      return new Promise((resolve, reject) => {
        const originalCallback = this._completeCallback;
        
        this._completeCallback = (url, filename, size) => {
          if (originalCallback) {
            originalCallback(url, filename, size);
          }
          
          // Trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the URL when done
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 100);
          
          resolve();
        };
        
        // Handle errors
        this._errorCallback = (message) => {
          reject(new Error(message));
        };
      });
    } else {
      // In main thread mode, use the original implementation
      console.log('completing...');
      return new Promise((res, rej) => {
        this._zipper.generateAsync({ 
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 }
        }, (metadata) => {
          if (this._compressionCallback) {
            this._compressionCallback(Math.round(metadata.percent));
          }
        }).then((blob) => {
          const fileName = `${archiveName}.zip`;
          saveAs(blob, fileName);
          this.clear();
          res();
        }).catch(rej);
      });
    }
  }
}

// React component that uses the Zipper class
const ZipperComponent = ({ 
  onDownloadComplete, 
  useWorker = true, 
  workerPath = '/download-worker.js',
  defaultArchiveName = 'animation-export'
}) => {
  const [status, setStatus] = useState('idle'); // idle, processing, compressing, complete, error
  const [progress, setProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [error, setError] = useState(null);
  const zipperRef = useRef(null);
  
  // Initialize the zipper
  useEffect(() => {
    zipperRef.current = new Zipper();
    
    if (useWorker) {
      const workerInitialized = zipperRef.current.useWorker(workerPath);
      if (!workerInitialized) {
        console.warn('Web Worker initialization failed, falling back to main thread');
      }
    }
    
    // Set up callbacks
    zipperRef.current
      .onProgress((percentage) => {
        setProgress(percentage);
      })
      .onCompression((percentage) => {
        setStatus('compressing');
        setCompressionProgress(percentage);
      })
      .onError((message) => {
        setStatus('error');
        setError(message);
      })
      .onComplete(() => {
        setStatus('complete');
        if (onDownloadComplete) {
          onDownloadComplete();
        }
      });
    
    return () => {
      if (zipperRef.current) {
        zipperRef.current.clear();
      }
    };
  }, [useWorker, workerPath, onDownloadComplete]);
  
  // Example method to add a canvas to the zip
  const addCanvas = async (filename, canvasElement) => {
    if (zipperRef.current) {
      setStatus('processing');
      await zipperRef.current.addImage(filename, canvasElement, null);
    }
  };
  
  // Example method to add an SVG to the zip
  const addSvg = async (filename, svgElement) => {
    if (zipperRef.current) {
      setStatus('processing');
      await zipperRef.current.addImage(filename, null, svgElement);
    }
  };
  
  // Example method to add both canvas and SVG for the same frame
  const addFrame = async (filename, canvasElement, svgElement) => {
    if (zipperRef.current) {
      setStatus('processing');
      await zipperRef.current.addImage(filename, canvasElement, svgElement);
    }
  };
  
  // Example method to generate and download the zip
  const downloadZip = async (archiveName = defaultArchiveName) => {
    if (zipperRef.current) {
      try {
        await zipperRef.current.complete(archiveName);
        // The zipper will be cleared after completion
        zipperRef.current = new Zipper();
        if (useWorker) {
          zipperRef.current.useWorker(workerPath);
        }
      } catch (err) {
        setStatus('error');
        setError(err.message);
      }
    }
  };
  
  return {
    status,
    progress,
    compressionProgress,
    error,
    addCanvas,
    addSvg,
    addFrame,
    downloadZip,
    zipper: zipperRef.current
  };
};

export default ZipperComponent;