import React, { createContext, useCallback, useContext, useReducer } from "react";

const ctx = createContext<any>({});

export const useChangeHandler = () => {
  const { updateColor } = useContext(ctx);
  return (redOrBlue: "red" | "blue") => {
    updateColor(redOrBlue);
  };
};

export const useColor = () => {
  const { color } = useContext(ctx);
  return color;
};

export const useUnsafeChangeHandler = () => {
  return (redOrBlue: "red" | "blue") => {
    (ctx as any).color = redOrBlue;
  };
};

function reducer (state: 'red' | 'blue', action: {type: 'update_color', value: 'red' | 'blue'}) {
  return action.value
}

export const Root = ({ children }: any) => {
  const [color, dispatch] = useReducer(reducer, 'red');
  const updateColor = useCallback(
    (color: "red" | "blue") => dispatch({value: color, type: 'update_color'}),
    []
  );

  return (
    <ctx.Provider
      value={{
        color,
        updateColor,
      }}
    >
      {children}
    </ctx.Provider>
  );
};
