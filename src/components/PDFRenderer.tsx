import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {usePageContext} from '../contexts/PageContext'
import {EditProvider, useEditContext} from '../contexts/EditContext'

const workerPath: string = '../../pdf/pdf.worker.mjs'
pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

interface PDFViewerProps {
}

interface PDFPosition {
  x: number;
  y: number;
}

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
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

const PDFViewerContent: React.FC<PDFViewerProps> = () => {
  //pdfUrl
  const [pdfUrl, setPdfUrl] = useState<string>('./assets/plan.pdf');
  const canvasRef = useRef<HTMLCanvasElement>(null); //reference a value that will not load page data
  const containerRef = useRef<HTMLDivElement>(null);
  // contexts
  const { pageNum, setPageNum, numPages, setNumPages } = usePageContext();
  const {state, setState} = useEditContext();

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

  // crop vars
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropStart, setCropStart] = useState<PDFPosition>({x: 0, y: 0});
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState<boolean>(false);
  const [cropDragOffset, setCropDragOffset] = useState<PDFPosition>({x: 0, y: 0});



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
      
      // HIGH-RESOLUTION RENDERING
      const devicePixelRatio = window.devicePixelRatio || 1;
      const qualityMult = 3;
      const renderScale = fitScale * devicePixelRatio * qualityMult;

      // Create viewport with high-resolution scale
      const viewport = page.getViewport({ scale: renderScale, rotation: 0 });
  
      // Set canvas internal resolution (high-res)
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // CRITICAL: Set canvas display size (what user actually sees)
      const displayWidth = naturalViewport.width * fitScale;
      const displayHeight = naturalViewport.height * fitScale;
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';

      // Add quality settings to canvas context
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      // Center the PDF in the container (use display dimensions, not canvas dimensions)
      const centerX = (containerWidth - displayWidth) / 2;
      const centerY = (containerHeight - displayHeight) / 2;
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
      const fitScale = Math.min(scaleX, scaleY);

      // HIGH-RESOLUTION RENDERING for resize too
      const devicePixelRatio = window.devicePixelRatio || 1;
      const qualityMult = 2.5; // Match your renderPage quality
      const renderScale = fitScale * devicePixelRatio * qualityMult;

      const viewport = page.getViewport({scale: renderScale, rotation:0});

      // Set canvas resolution and display size
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const displayWidth = originalViewport.width * fitScale;
      const displayHeight = originalViewport.height * fitScale;
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';

      // Add quality settings
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

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

  // const adjustToResize = useCallback(() => {
  //   if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
    
  //   const container = containerRef.current;
  //   const canvas = canvasRef.current;
    
  //   // Get current container dimensions
  //   const containerWidth = container.clientWidth;
  //   const containerHeight = container.clientHeight;
    
  //   // Update position without re-rendering the PDF
  //   const centerX = (containerWidth - canvas.width / pdfCssScale) / 2;
  //   const centerY = (containerHeight - canvas.height / pdfCssScale) / 2;
    
  //   setPosition({ x: centerX, y: centerY });
  // }, [pdfDoc, pdfCssScale]);

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

        renderPage(pageNum, pdf);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };
    loadPDf();
  }, [pdfUrl]);

  // Navigation functions
  // const goToPrevPage = () => {
  //   if (pageNum <= 1) return;
  //   const newPageNum = pageNum - 1;
  //   setPageNum(newPageNum);
  //   renderPage(newPageNum);
  // };

  // const goToNextPage = () => {
  //   if (pageNum >= numPages) return;
  //   const newPageNum = pageNum + 1;
  //   setPageNum(newPageNum);
  //   renderPage(newPageNum);
  // };

  // const jumpPage = () => {
  //   if (pageNum >= numPages) return;
  //   const newPageNum = pageNum + 1;
  //   setPageNum(newPageNum);
  //   renderPage(newPageNum);
  // }

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

  const clearCrop = useCallback(() => {
    setCropBox({ x: 0, y: 0, width: 0, height: 0 });
  }, []);

  const applyCrop = useCallback(() => {
      if (cropBox.width > 0 && cropBox.height > 0) {
        console.log('Applying crop to PDF:', {
          page: pageNum,
          crop: cropBox,
          pdfScale: pdfCssScale
        });
        alert(`Crop applied: ${Math.round(cropBox.width)}×${Math.round(cropBox.height)} at (${Math.round(cropBox.x)}, ${Math.round(cropBox.y)})`);

        // send crop to REST API
        
      }
    }, [cropBox, pageNum, pdfCssScale]);

  //helper func for crop
  const getRelativeMousePosition = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / pdfCssScale,
      y: (e.clientY - rect.top) / pdfCssScale
    };
  }, [pdfCssScale]);

  //pan functions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (state === 'auto') {
      const pos = getRelativeMousePosition(e);
      if (cropBox.width > 0 && cropBox.height > 0) {
        const isInsideCrop = pos.x >= cropBox.x && 
                            pos.x <= cropBox.x + cropBox.width &&
                            pos.y >= cropBox.y && 
                            pos.y <= cropBox.y + cropBox.height;
        if (isInsideCrop) {
          setIsDraggingCrop(true);
          setCropDragOffset({
            x: pos.x - cropBox.x,
            y: pos.y - cropBox.y
          });
          return;
      }
    }
      setIsCropping(true);
      setCropStart(pos);
      setCropBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
    } else {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    };
  }

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsCropping(false);
    setIsDraggingCrop(false);
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (state==='auto') {
      if (isDragging && canvasRef.current) {
        const pos = getRelativeMousePosition(e);
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const max_X = (canvasRect.width / pdfCssScale) - cropBox.width;
        const max_Y = (canvasRect.height / pdfCssScale) - cropBox.height;

        const new_X = Math.max(0, Math.min(pos.x - cropDragOffset.x, max_X));
        const new_Y = Math.max(0, Math.min(pos.y - cropDragOffset.y, max_Y));

        setCropBox((prev) => ({...prev, x: new_X, y: new_Y}))

      } else if (isCropping) {
        const pos = getRelativeMousePosition(e);
        const width = pos.x - cropStart.x;
        const height = pos.y - cropStart.y;
        
        setCropBox({
          x: width < 0 ? pos.x : cropStart.x,
          y: height < 0 ? pos.y : cropStart.y,
          width: Math.abs(width),
          height: Math.abs(height)
        });
      }
    }
    if (!isDragging) return;
    setPosition({
      x: 1*(e.clientX - dragStart.x),
      y: 1*(e.clientY - dragStart.y)
    });
  }

  useEffect(()=> {
    if (state !== 'auto') {
      setCropBox({ x: 0, y: 0, width: 0, height: 0 });
    }
  }, [state])

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);



  return(
    <div className='w-full h-full relative'> {/* ADD: relative positioning */}
      {(isLoading) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-lg text-gray-700">Loading PDF...</p>
        </div>
      )}
      {/* pdf render */}
      <div 
        ref={containerRef}
        className='overflow-hidden w-full h-full relative'
        onWheel={handleWheel}
        style={{ 
          cursor: state === 'auto' 
            ? (isCropping ? 'crosshair' : (isDraggingCrop ? 'move' : 'crosshair'))
            : (isDragging ? 'grabbing' : 'grab')
        }}
      >
        <canvas 
          ref={canvasRef}
          className=''
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${pdfCssScale})`,
            transformOrigin: '0 0',
            transition: 'transform 0.05s ease-out', 
            touchAction: 'none',
            cursor: 'inherit'
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        />

{/* Improved Crop Box Overlay - Only show in auto mode */}
        {state === 'auto' && (cropBox.width > 0 || cropBox.height > 0) && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: position.x,
              top: position.y,
              transform: `scale(${pdfCssScale})`,
              transformOrigin: '0 0'
            }}
          >
            
            {/* Crop box border */}
            <div
              className="absolute border-2 border-blue-500 border-dashed"
              style={{
                left: cropBox.x,
                top: cropBox.y,
                width: cropBox.width,
                height: cropBox.height
              }}
            />
            
            {/* Corner handles */}
            {cropBox.width > 20 && cropBox.height > 20 && (
              <>
                <div className="absolute w-2 h-2 bg-white border border-blue-500"
                    style={{ left: cropBox.x - 4, top: cropBox.y - 4 }} />
                <div className="absolute w-2 h-2 bg-white border border-blue-500"
                    style={{ left: cropBox.x + cropBox.width - 4, top: cropBox.y - 4 }} />
                <div className="absolute w-2 h-2 bg-white border border-blue-500"
                    style={{ left: cropBox.x - 4, top: cropBox.y + cropBox.height - 4 }} />
                <div className="absolute w-2 h-2 bg-white border border-blue-500"
                    style={{ left: cropBox.x + cropBox.width - 4, top: cropBox.y + cropBox.height - 4 }} />
              </>
            )}
          </div>
        )}
        {/* ADD: Instructions overlay */}
        {state === 'auto' && cropBox.width === 0 && cropBox.height === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded">
              Click and drag to create crop area
            </div>
          </div>
        )}
      </div>

      {/* ADD: Crop controls - Only show when there's an active crop */}
      {state === 'auto' && cropBox.width > 0 && cropBox.height > 0 && (
        <div className="absolute bottom-4 left-4 flex gap-2 z-20">
          <button
            onClick={applyCrop}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Apply Crop ({Math.round(cropBox.width)}×{Math.round(cropBox.height)})
          </button>
          <button
            onClick={clearCrop}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
};

  const PDFViewer = () =>{
    return(
        <PDFViewerContent/>
    )
  }


export default React.memo(PDFViewer);