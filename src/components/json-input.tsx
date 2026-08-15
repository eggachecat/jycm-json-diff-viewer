import React from "react";

import MonacoEditor from "react-monaco-editor";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";

export const JsonInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => {
  return (
    <AutoSizer>
      {({ height, width }) => {
        return (
          <MonacoEditor
            width={`${width}px`}
            height={`${height}px`}
            theme="vs"
            language="json"
            value={value}
            onChange={(e) => {
              onChange(e);
            }}
            options={{
              readOnly: false,
              automaticLayout: true,
              folding: true,
              wordWrap: "on",
              minimap: { enabled: false },
              fontSize: 13,
            }}
          />
        );
      }}
    </AutoSizer>
  );
};
