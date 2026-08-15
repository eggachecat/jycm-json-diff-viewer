import * as React from "react";

const contextValue = {
  pairInfo: {},
  activeLeftJsonPath: [],
  activeRightJsonPath: [],
  leftJsonPath2DiffDetail: {},
};

export const JYCMContext = React.createContext(contextValue);
export const useJYCM = () => contextValue;
export const useJYCMContext = () => React.useContext(JYCMContext);
export const JYCMRender = () => (
  <div data-testid="jycm-render">Visual diff</div>
);
