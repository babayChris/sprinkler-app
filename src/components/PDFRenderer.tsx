import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDfContext } from './sidebarComponents/PageTool';


const workerPath: string = '../../pdf/pdf.worker.mjs'
pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

interface PDFViewerProps {
}

interface PDFPosition {
  x: number;
  y: number;
}

//helper functions
function debounce(func: Function, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  const debouncedFunc = function(this: any, ...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
  (debouncedFunc as any).cancel = () => clearTimeout(timeout);
  return debouncedFunc;
}

const PDFViewer: React.FC<PDFViewerProps> = () => {
  //pdfUrl
   const [pdfUrl, setPdfUrl] = useState<string>('./assets/plan.pdf');

  const canvasRef = useRef<HTMLCanvasElement>(null); //reference a value that will not load page data
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [renderTask, setRenderTask] = useState<any>(null);

  //loading vars
  const [isLoading, setIsLoading] = useState<boolean>(true);

  //pdf positioning
  const [pdfCssScale, setPdfCssScale] = useState<number>(1);
  const [position, setPosition] = useState<PDFPosition>({x: 0, y:0});

  //toolStates
  // const {activeTool} = useTool();

  //pan variables
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<PDFPosition>({x:0, y:0});

  //render page
  const renderPage = useCallback(async (pageNum: number, pdf=pdfDoc) => {
    if (!pdf) return;
    try {
      setIsLoading(true);
      if (renderTask && renderTask.cancel) {
        renderTask.cancel();
      }
      //get page
      const page = await pdf.getPage(pageNum);
  
      //get canvas element
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      const context = canvas.getContext('2d');
      if (!context) return;
  
      // Get container dimensions
      const container = containerRef.current;
      if (!container) return;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Get page's natural dimensions at scale 1
      const naturalViewport = page.getViewport({ scale: 1.0, rotation: 0 });
      
      // Calculate scale to fit the page in the container
      const scaleX = containerWidth / naturalViewport.width;
      const scaleY = containerHeight / naturalViewport.height;
      const fitScale = Math.min(scaleX, scaleY); 
      
      // Create viewport with proper scale and explicit rotation=0
      const viewport = page.getViewport({ scale: fitScale, rotation: 0 });
  
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Center the PDF in the container
      const centerX = (containerWidth - viewport.width) / 2;
      const centerY = (containerHeight - viewport.height) / 2;
      setPosition({ x: centerX, y: centerY });
      
      //render
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        enableWebGL: true,
        renderInteractiveForms: true,
        intent: 'display'
      };

      const task = page.render(renderContext);
      setRenderTask(task);
      await task.promise;
      await new Promise(resolve => setTimeout(resolve, 50));
      setIsLoading(false);
    } catch (error) {
    if (error instanceof Error && error.message !== 'Rendering cancelled') {
      console.error('Error rendering Page', error);
    }}
  },[pdfDoc, setIsLoading, setPosition, setPdfCssScale, setRenderTask]);

  const handleResize = useCallback(async ()=> {
    if (!pdfDoc) return;
    try{
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      const container = containerRef.current;
      if(!container) return;
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;

      const originalViewport = page.getViewport({ scale: 1.0, rotation:0 })

      //find scale needed to fit container
      const scaleX = containerW / originalViewport.width;
      const scaleY = containerH / originalViewport.height;
      const fitScale = Math.min(scaleX, scaleY) * pdfCssScale;

      const viewport = page.getViewport({scale: fitScale / pdfCssScale, rotation:0});

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        enableWebGL: true,
        renderInteractiveForms: true,
        intent: 'display'
      };
      
      const task = page.render(renderContext);
      setRenderTask(task);
      await task.promise;
      await new Promise(resolve => setTimeout(resolve, 50));
      setIsLoading(false);

    } catch (error){
      console.log('Error in handleResize:', error);
      setIsLoading(false);
    }
  }, [pdfDoc, pageNum, pdfCssScale]);

  const adjustToResize = useCallback(() => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    // Get current container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Update position without re-rendering the PDF
    const centerX = (containerWidth - canvas.width / pdfCssScale) / 2;
    const centerY = (containerHeight - canvas.height / pdfCssScale) / 2;
    
    setPosition({ x: centerX, y: centerY });
  }, [pdfDoc, pdfCssScale]);

  //resize useEffect
  useEffect(() => {
    if (!containerRef.current || !pdfDoc) return;
    
    const debouncedHandleResize = debounce(()=>{
      handleResize();
    }, 500)

    const resizeObserver = new ResizeObserver(debouncedHandleResize);

    const currentContainer = containerRef.current;

    resizeObserver.observe(currentContainer);
    
    return () => {
      if (currentContainer) {
        resizeObserver.unobserve(currentContainer);
      }
      (debouncedHandleResize as any).cancel();
    };
  }, [pdfDoc, handleResize]);

  //loadPDF when component mounts or URL changes
  useEffect(() => {
    const loadPDf = async () => {
      try {
        if (!pdfUrl) {
          console.log('pdfURL is null at loadPDF useEffect')
          return;
        }

        const loading = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loading.promise;

        setPdfDoc(pdf);
        setNumPages(pdf.numPages);

        renderPage(1, pdf);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };
    loadPDf();
  }, [pdfUrl]);

  // Navigation functions
  const goToPrevPage = () => {
    if (pageNum <= 1) return;
    const newPageNum = pageNum - 1;
    setPageNum(newPageNum);
    renderPage(newPageNum);
  };

  const goToNextPage = () => {
    if (pageNum >= numPages) return;
    const newPageNum = pageNum + 1;
    setPageNum(newPageNum);
    renderPage(newPageNum);
  };

  const jumpPage = () => {
    if (pageNum >= numPages) return;
    const newPageNum = pageNum + 1;
    setPageNum(newPageNum);
    renderPage(newPageNum);
  }

  //zoom functions
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    
    // Calculate new CSS scale
    const delta = -Math.sign(event.deltaY) * 0.1;
    const newCssScale = Math.max(0.5, Math.min(5, pdfCssScale + delta));
    
    // Calculate new position for proper zooming around cursor
    const rectangle = canvasRef.current?.getBoundingClientRect();
    if (!rectangle) return;
    
    // Mouse position relative to canvas
    const mouseX = event.clientX - rectangle.left;
    const mouseY = event.clientY - rectangle.top;
    
    // Adjust position to zoom toward mouse cursor
    const factor = delta / pdfCssScale;
    const newPos = {
      x: position.x - mouseX * factor,
      y: position.y - mouseY * factor
    };
    
    setPdfCssScale(newCssScale);
    setPosition(newPos);
  };
  //pan functions
  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
  }

  const handleMouseUp = () => {
    setIsDragging(false);
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: 1*(e.clientX - dragStart.x),
      y: 1*(e.clientY - dragStart.y)
    });
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  //pdf Context
  const pdfContextValues = {
    pdfDoc,
    pageNum,
    setPageNum: jumpPage,
    numPages,
  };

  return(
    <div className='w-full h-full'>
      {(isLoading) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-lg text-gray-700">Loading PDF...</p>
        </div>
      )}
      {/* nav controls */}
      {/* pdf render */}
      <div ref={containerRef}
      className='overflow-hidden w-full h-full border-4'
      onWheel={handleWheel}
      >
        <canvas ref={canvasRef}
        className=''
        style={{
          transform:  `translate(${position.x}px, ${position.y}px) scale(${pdfCssScale})`,
          transformOrigin: '0 0',
          transition: 'transform 0.05s ease-out', 
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}/>
      </div>
    </div>
  )

};


export default React.memo(PDFViewer);