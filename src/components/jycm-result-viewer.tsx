import React from "react";

import MonacoEditor from "react-monaco-editor";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";

export const JYCMResultViewer: React.FC<{ jycmResult: any }> = ({
  jycmResult,
}) => {
  return (
    <AutoSizer>
      {({ height, width }) => {
        return (
          <MonacoEditor
            width={`${width}px`}
            height={`${height}px`}
            theme="vs"
            language="json"
            value={JSON.stringify(jycmResult, null, 2)}
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
