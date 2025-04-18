import React, { useState, useEffect, type ReactNode } from 'react'
import { GrPan } from "react-icons/gr";
import './App.css'
import SideBar from './components/Sidebar.tsx'
import PDFViewer from './components/PDFRenderer.tsx'
import { useTool } from './contexts/ToolContext.tsx'



function App() {
  const [sidebarOpen, setSidebarOpen] = useState('close');
  const {activeTool, setActiveTool} = useTool();

  return (
  <div className='relative'>
    {/* topBar */}
    <div className="fixed top-0 left-0 w-screen h-20 bg-gray-700 z-30 shadow-2xl flex flex-row">
      <TopBarIcon icon={<GrPan size='28'/>} onClick={setActiveTool('pan')}/>
    </div>
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
    <div className='fixed bottom-0 left-0 w-screen h-9 bg-gray-700 shadow-2xs'>
<a href=""></a>
    </div>
  </div>
  );
}

const TopBarIcon = ({icon, text = 'tooltip', onClick}: {icon:ReactNode, text?:string, onClick?: any}) => {
  return(
    <div className='relative flex items-center justify-center h-full w-20 mx-auto hover:bg-gray-800'
    onClick = {onClick}>
      {icon}
      <span className='sidebar-tooltip group-hover:scale-100 delay-500'>
        {text}
      </span>
    </div>
  );
}

export default App;