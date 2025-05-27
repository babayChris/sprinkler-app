import React, { ReactNode, useState } from 'react';
import { TbMask } from "react-icons/tb";
import { IoLayersOutline } from "react-icons/io5";
import PageTool from './sidebarComponents/PageTool'
import './SideBar.css'
import MaskTool from './sidebarComponents/MaskTool' 


const SideBar = ({sideBarStateChange}: {sideBarStateChange:(sideBarState:string)=>void}) => {
    const [sideBarState, setSideBarState] = useState('close'); //true (open) false (closed)

    const toggleSidebar = (view:string) => {
        const newState = sideBarState === view ? 'close' : view;
        setSideBarState(newState);
        sideBarStateChange(newState);
    };

    return(
        <div>
        {/* Main sidebar with icons - added top and bottom padding */}
        <div className='fixed left-0 h-[calc(100vh-6rem)] w-16 flex flex-col bg-gray-700 text-white shadow z-20'>
            {/* mask menu */}
            <SideBarIcon icon={<IoLayersOutline size='28'/>} onClick={() => toggleSidebar('pageTool')}/> 
            <SideBarIcon icon={<TbMask size='28'/>} onClick={() => toggleSidebar('maskTool')}/>
        </div>

        {/* sliding bar - adjusted height and added top/bottom margins */}
        <div className={`fixed left-16 h-[calc(100vh-6rem)] w-64 bg-gray-800 text-white shadow transition-transform
            duration-300 ease-in-out z-10 ${sideBarState != 'close' ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className='p-4'>
                <h2>
                    {sideBarState === 'pageTool' ? (
                        <PageTool/>
                    ) : sideBarState === 'maskTool' ? (
                        <>
                        <MaskTool/>
                        </>
                    ) : (<div>
                        <p>No Tool selected ISSUE</p>
                    </div>)}
                </h2>
            </div>
        </div>
    </div>
    )
};

const SideBarIcon = ({ icon, text = "tooltip", onClick }: {icon:ReactNode, text?:string, onClick?:()=>void}) => {
    return(
        <div className='sidebar-icon group' onClick={onClick}>
            {icon}
            <span className='sidebar-tooltip group-hover:scale-100 delay-500'>
                {text}
            </span>
        </div>
    )
};

export default SideBar;