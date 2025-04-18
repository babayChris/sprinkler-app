import React, { createContext, useState, useContext } from "react";


export type ToolType = 'pan' | 'none'

const ToolContext = createContext<{
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
}>({
	activeTool: 'pan',
  setActiveTool: () => {},
});

export const ToolProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [activeTool, setActiveTool] = useState<ToolType>('pan');
	return (
		<ToolContext.Provider value={{ activeTool, setActiveTool }}>
			{children}
		</ToolContext.Provider>
	);
};

export const useTool = () => useContext(ToolContext);