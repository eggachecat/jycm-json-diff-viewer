import * as React from "react";

const MonacoEditor: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value = "", onChange }) => (
  <textarea
    aria-label="JSON editor"
    value={value}
    onChange={(event) => onChange?.(event.target.value)}
  />
);

export default MonacoEditor;
