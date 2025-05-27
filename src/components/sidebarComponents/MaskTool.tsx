import {useState} from 'react'
import { useEditContext, EditProvider } from '../../contexts/EditContext';


interface Point {
  x: number,
  y: number,
  class: string,
}


const MaskToolContent = () => {
  const [numHeads, setNumHeads] = useState<number>(0);
  const {state, setState} = useEditContext();

  const handleAutoButton = () => {
    setState(state === 'auto' ? 'off' : 'auto');
  };
  return(

    <div>
      {/* Info tab */}
      <div className='border-1 rounded-3xl h-80'>
        <h2 className=''>Info</h2>
      </div> 
      {/* masking tools*/}
      <div className='border-2 h-80 flex-col'>
        <h2>Tools</h2>
        {/* manual Masking button */}
        <button className='w-40'>
          Manual
        </button>
        <button className={`w-40 ${state === 'auto' ? 'bg-green-500 text-white' : 'bg-gray-200'}`} onClick={handleAutoButton}>
          Auto {state === 'auto' ? '(ON)' : '(OFF)'}
        </button>
      </div>
    </div>

  )
}

const MaskTool = () => {

  return(
      <MaskToolContent/>
  )
}

export default MaskTool;