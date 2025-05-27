import React, { useState, useEffect, type ReactNode } from 'react'
import { MdAutoAwesome } from "react-icons/md";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from "react-icons/md";
import {PageProvider, usePageContext} from './contexts/PageContext.tsx'
import './App.css'
import SideBar from './components/Sidebar.tsx'
import PDFViewer from './components/PDFRenderer.tsx'

interface PageInputProps {
  pageNum: number;
  setPageNum: (page: number) => void;
  maxPages: number;
}
const PageInput: React.FC<PageInputProps> = ({ pageNum, setPageNum, maxPages }) => {
  const [inputValue, setInputValue] = useState<string>(pageNum.toString());

  // Sync with context when pageNum changes externally
  useEffect(() => {
    setInputValue(pageNum.toString());
  }, [pageNum]);

  const handlePageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const validateAndUpdate = () => {
    if (inputValue === '') {
      setInputValue(pageNum.toString());
      return;
    }
    
    const newPageNum = Number(inputValue);
    if (isNaN(newPageNum) || newPageNum < 1 || newPageNum > maxPages) {
      setInputValue(pageNum.toString());
      return;
    }
    
    setPageNum(newPageNum);
  };

  return (
    <input 
      className='text-center bg-transparent hover:border-gray-400 hover:border-2 focus:border-blue-500 focus:border-2 outline-none w-8 h-5 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
      value={inputValue}
      onChange={handlePageChange}
      onBlur={validateAndUpdate}
      onKeyDown={(e) => e.key === 'Enter' && validateAndUpdate()}
      type="number"
      min="1"
      max={maxPages}
    />
  );
};


function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState('close');
  const { pageNum, setPageNum, numPages } = usePageContext();

  return (
  <div className='relative'>
    {/* topBar */}
    <div className="fixed top-0 left-0 w-screen h-20 bg-gray-700 z-30 shadow-2xl flex flex-row">
      <TopBarIcon icon={<MdAutoAwesome size='28'/>}/>
    </div>
    {/* modal */}

    {/* middle window */} 
    <div className='fixed w-screen bottom-12 left-0 top-20'>
      <div className='relative'>
        <SideBar sideBarStateChange={setSidebarOpen}/>
      </div>
      {/* pdf renderer */}
      <div className="fixed inset-y-0 right-0 overflow-hidden flex items-center justify-center top-20 bottom-9"
      style={{
        left: sidebarOpen !== 'close' ? '21rem' : '5rem',
        transition: 'left 300ms ease-in-out'
      }}>
        <PDFViewer/>
      </div>
    </div>
    {/* bottom bar (page control, view control, scale, page dims)*/}
    <div className='fixed bottom-0 left-0 w-screen h-9 bg-gray-700 shadow-2xs items-center'>
      <div className='absolute right-3 h-full w-auto flex flex-row gap-1 items-center justify-between'>
        {/* page num control */}
        <MdKeyboardDoubleArrowLeft 
          className='h-5 w-5 hover:bg-gray-900 hover:rounded cursor-pointer flex items-center justify-center' 
          onClick={()=>{if (pageNum > 1) setPageNum(pageNum-1)}}
        />
        <PageInput pageNum={pageNum} setPageNum={setPageNum} maxPages={100}/> 
        <MdKeyboardDoubleArrowRight 
          className='h-5 w-5 hover:bg-gray-900 hover:rounded cursor-pointer flex items-center justify-center' 
          onClick={() => {setPageNum(pageNum + 1)}}
        />
      </div>
    </div>
  </div>
  );
}

const TopBarIcon = ({icon, text = 'tooltip', onClick}: {icon: ReactNode, text?: string, onClick?: any}) => {
  const [isActive, setIsActive] = useState(false);
  
  const handleClick = () => {
    setIsActive(!isActive);
    if (onClick) onClick();
  };
  
  return(
    <div 
      className={`relative flex items-center justify-center h-full w-20 mx-auto 
        hover:bg-gray-800 focus:shadow transition-all duration-200
        ${isActive ? 'border-b-4 border-blue-100' : ''}`}
      onClick={handleClick}
    >
      <div className="transition-all duration-200 hover:brightness-125">
        {icon}
      </div>
      <span className='sidebar-tooltip group-hover:scale-100 delay-500'>
        {text}
      </span>
    </div>
  );
}

function App() {
  return(
    <PageProvider>
      <AppContent/>
    </PageProvider>
  );
}

export default App;

