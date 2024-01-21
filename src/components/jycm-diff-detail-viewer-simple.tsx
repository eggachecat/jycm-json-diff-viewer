import React from "react";

import { useJYCMContext } from "react-jycm-viewer";
import MonacoEditor from "react-monaco-editor";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";

export const DiffDetailViewer: React.FC<any> = () => {
  const {
    pairInfo,
    activeLeftJsonPath,
    activeRightJsonPath,
    leftJsonPath2DiffDetail,
  } = useJYCMContext();

  return (
    <AutoSizer>
      {({ height, width }) => {
        return (
          <MonacoEditor
            width={`${width}px`}
            height={`${height}px`}
            theme="vs"
            language="json"
            value={JSON.stringify(pairInfo, null, 2)}
            options={{
              readOnly: true,
              automaticLayout: true,
              folding: true,
              wordWrap: "on",
            }}
          />
        );
      }}
    </AutoSizer>
  );
};
