// mupdf-worker.js
// Use ES module import syntax
import * as mupdf from '/mupdf/mupdf.js';

// Define variables to store state
let document = null;
let pages = {};

// Handle messages from the main thread
self.onmessage = async function(e) {
  const data = e.data;
  
  switch (data.type) {
    case 'openDocument':
      try {
        // Convert the ArrayBuffer to a Uint8Array
        const buffer = new Uint8Array(data.buffer);
        
        // Open the document with MuPDF
        document = mupdf.Document.openDocument(buffer, "application/pdf");
        
        // Get the number of pages
        const numPages = document.countPages();
        
        // Send back the document information
        self.postMessage({
          type: 'documentLoaded',
          document: {
            id: Date.now(), // Just a placeholder to identify the document
          },
          numPages: numPages
        });
      } catch (error) {
        self.postMessage({
          type: 'error',
          message: 'Failed to open document: ' + error.message
        });
      }
      break;
      
    case 'renderPage':
      try {
        if (!document) {
          throw new Error('No document loaded');
        }
        
        const { pageNum, width, height, scale } = data;
        
        // Load the page
        const page = document.loadPage(pageNum - 1); // MuPDF uses 0-based indexing
        
        // Calculate the best scale to fit the page in the container
        const pageBounds = page.getBounds();
        const pageWidth = pageBounds[2] - pageBounds[0];
        const pageHeight = pageBounds[3] - pageBounds[1];
        
        const scaleX = width / pageWidth;
        const scaleY = height / pageHeight;
        const fitScale = Math.min(scaleX, scaleY) * scale;
        
        // Render the page to a PNG
        const pixmap = page.toPixmap(
          [fitScale, 0, 0, fitScale, 0, 0], // Transform matrix with scale
          mupdf.ColorSpace.DeviceRGB,
          false, // no alpha
          true // interpolate
        );
        
        // Convert the pixmap to a PNG data URL
        const pngData = pixmap.asPNG();
        const blob = new Blob([pngData], { type: 'image/png' });
        
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Send back the rendered page
        self.postMessage({
          type: 'pageRendered',
          pageNum: pageNum,
          width: pixmap.getWidth(),
          height: pixmap.getHeight(),
          imageData: url
        });
        
        // Clean up
        pixmap.destroy();
        page.destroy();
      } catch (error) {
        self.postMessage({
          type: 'error',
          message: 'Failed to render page: ' + error.message
        });
      }
      break;
      
    case 'closeDocument':
      if (document) {
        document.destroy();
        document = null;
        pages = {};
      }
      self.postMessage({
        type: 'documentClosed'
      });
      break;
      
    default:
      self.postMessage({
        type: 'error',
        message: 'Unknown command: ' + data.type
      });
      break;
  }
};