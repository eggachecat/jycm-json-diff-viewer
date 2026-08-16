import * as React from "react";

const AutoSizer: React.FC<{
  children: (size: { height: number; width: number }) => React.ReactNode;
}> = ({ children }) => <>{children({ height: 300, width: 400 })}</>;

export default AutoSizer;
