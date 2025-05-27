import * as pdfjsLib from 'pdfjs-dist';
import React, { useContext, useState, useEffect } from 'react';

//render worker
const workerPath: string = '../../pdf/pdf.worker.mjs'
pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

//page context
export const PDfContext = React.createContext<{
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  pageNum: number;
  setPageNum: (pageNum: number) => void;
  numPages: number;
}>({
  //init
  pdfDoc: null,
  pageNum: 1,
  setPageNum: () => {} ,
  numPages: 0,
});


const PageTool: React.FC = () => {
  const { pdfDoc, numPages, pageNum, setPageNum } = useContext(PDfContext);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const generateThumbnails = async () => {
      if (!pdfDoc) {
        console.log("No PDF doc available");
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const newThumbnails: string[] = [];
        for (let i = 1; i <= numPages; i++) {
          try {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.2 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
  
            canvas.width = viewport.width;
            canvas.height = viewport.height;
  
            await page.render({
              canvasContext: context!,
              viewport: viewport
            }).promise;
            
            newThumbnails.push(canvas.toDataURL());
          } catch (error) {
            console.log(`Error in for loop of PageTool.tsx useEffect for page ${i} -> `, error);
          }
        }
        setThumbnails(newThumbnails);
      } catch (error) {
        console.error("Error in thumbnail generation:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    generateThumbnails();
  }, [pdfDoc, numPages]);

  const handlePageClick = (index: number) => {
    setPageNum(index+1);
  };


  return(
    <div className="page-tool">
      <h3>Pages</h3>

      {isLoading ? (
        <p>LOADING Thumbnails</p>
      ): (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-3">
          {thumbnails.length > 0 ? (
            thumbnails.map((thumbnail, index) => (
              <div
                key={index}
                className={`cursor-pointer transition-all duration-200 ${
                  pageNum === index + 1 
                    ? 'ring-2 ring-blue-500 transform scale-105' 
                    : 'hover:ring-1 hover:ring-gray-300'
                }`}
                onClick={() => handlePageClick(index)}
              >
                <div className="relative flex flex-col items-center">
                  <img 
                    src={thumbnail} 
                    alt={`Page ${index + 1}`} 
                    className="w-full shadow-md bg-white"
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-2 py-0.5 rounded-full">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No thumbnails available</p>
          )}
        </div>
      )}
    </div>
  )
}

export default React.memo(PageTool);