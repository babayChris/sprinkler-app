import React, { ReactNode } from 'react';
import { BsPlus, BsGearFill, BsFillLightningChargeFill } from 'react-icons/bs';
import { FaFire, FaPoo } from 'react-icons/fa';
import './SideBar.css'

const SideBar = () => {

    return(
    <div className ='fixed top-0 left-0 h-screen w-16 m-0 flex flex-col bg-gray-700 text-white shadow'>
        <SideBarIcon icon = {<FaFire size='28'/>}/>
        <SideBarIcon icon = {<BsPlus size='28'/>}/>
        <SideBarIcon icon = {<BsFillLightningChargeFill size='28'/>}/>
        <SideBarIcon icon = {<FaPoo size='28'/>}/>

    </div>
    )
};

const SideBarIcon = ({ icon, text = "tooltip" }: {icon:ReactNode, text?:string}) => {
    return(
        <div className="sidebar-icon group"> 
            {icon}
            <span className='sidebar-tooltip group-hover:scale-100'>
                {text}
            </span>
        </div>
    )
};

export default SideBar;