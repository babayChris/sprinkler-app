import React, {useState, useEffect, useRef} from 'react';
import defaultPdf from '../assets/EMJ Park Phase1A_Bid Set Drawings_5 OF 7.pdf';
import { Document, Page, pdfjs } from "react-pdf";
import '/node_modules/react-pdf/dist/esm/Page/AnnotationLayer.css';
import '/node_modules/react-pdf/dist/esm/Page/TextLayer.css';
const workerPath: string = '../../public/pdf/pdf.worker.mjs'

pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

const PDFViewer = () => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const [scale, setScale] = useState(100); //in percent
  const [origin, setOrigin] = useState('center center');
  const containerRef = useRef<HTMLDivElement>(null);
  
  //pdf Properties
  const [pdfDim, setPdfDim] = useState({width: 0, height:0});


  //zoom
  useEffect(() => {
    const handleScroll = () => {    
    const scrollPercentage = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const newScale = 100 + (scrollPercentage * 50); //tweak scalar for speed
    setScale(newScale);
  };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  },[]);  

  //mouse position for zoom
  useEffect(() => {
    const handleMouseMove = (e:any) => {
    if (containerRef.current) {
      const rectangle = containerRef.current.getBoundingClientRect();

      const x = ((e.clientX - rectangle.left) / rectangle.width) * 100;
      const y = ((e.clientY - rectangle.top) / rectangle.height) * 100;

      setOrigin(`${x}% ${y}%`);
    }
  };
  if (containerRef.current) {
    containerRef.current.addEventListener('mousemove', handleMouseMove);
  }

  return () => {
    if (containerRef.current) {
      containerRef.current.removeEventListener('mousemove', handleMouseMove);
    }
  };
},[]);


  function onDocumentLoadSuccess({ numPages, getPage }: { numPages: number, getPage:any }) {
    setNumPages(numPages);
    getPage(1).then((page:any) => {
      const viewport = page.getViewport({ scale: 1});
      setPdfDim({width: viewport.width, height: viewport.height});
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const widthRatio = (containerWidth / viewport.width) * 100;
        const heightRatio = (containerHeight / viewport.height) * 100;

        const fitScale = Math.min(widthRatio, heightRatio) * 0.95;

        setScale(fitScale);
      }
    })
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div id='zoomContainer' className="flex-1 transition-transform duration-300 ease-in-out"
      style={{ transform: `scale(${scale/100})`,
      transformOrigin: origin}}>
        <Document 
          file={defaultPdf} 
          onLoadError={console.error}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex justify-center"
        >
          <Page 
            pageNumber={pageNumber} 
            width={undefined}
            className="max-w-full"
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
      {/* page flipper */}
      {numPages && (
        <div className="h-12 flex items-center justify-between px-4 border-t">
          <button 
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {pageNumber} of {numPages}</span>
          <button 
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};


export default PDFViewer;