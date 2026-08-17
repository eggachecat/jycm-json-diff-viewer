import React from "react";

import MonacoEditor from "react-monaco-editor";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";

export const CodeInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  language?: "json" | "javascript";
  readOnly?: boolean;
}> = ({ value, onChange, language = "json", readOnly = false }) => {
  return (
    <AutoSizer>
      {({ height, width }) => {
        return (
          <MonacoEditor
            width={`${width}px`}
            height={`${height}px`}
            theme="vs"
            language={language}
            value={value}
            onChange={(e) => {
              onChange(e);
            }}
            options={{
              readOnly,
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

export const JsonInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = (props) => <CodeInput {...props} language="json" />;
