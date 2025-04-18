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

  useEffect(()=> {
    const generateThumbnails = async () => {
      if(!pdfDoc) return;      
      setIsLoading(true);

      const newThumbnails: string[] = [];

      for (let i = 1; i <= numPages; i++){
        try {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({scale:0.2});

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context!,
            viewport: viewport
          }).promise;
          
          newThumbnails.push(canvas.toDataURL())

        } catch (error) {
          console.log(`Error in for loop of PageTool.tsx useEffect for page ${i} -> `, error)
        }
      };
      setThumbnails(newThumbnails);
      setIsLoading(false);
    };
    generateThumbnails();
  }, [pdfDoc, numPages])

  const handlePageClick = (index: number) => {
    setPageNum(index+1);
  };


  return(
    <div className="page-tool">
      <h3>Pages</h3>

      {isLoading ? (
        <p>LOADING Thumbnails</p>
      ): (
        <div>
          
        </div>
      )}
    </div>
  )
}

export default React.memo(PageTool);