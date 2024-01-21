import React, { useEffect } from "react";

import { JYCMContext, JYCMRender, useJYCM } from "react-jycm-viewer";
import {
  jycmConfig as defaultJYCMConfig,
  leftJson as defaultLeftJson,
  rightJson as defaultRightJson,
} from "./render-case/case-1";
import { DiffDetailViewer } from "./jycm-diff-detail-viewer-simple";
import { YouchamaJsonDiffer, get_jycm_instance_from_json } from "jycm";
import { JsonInput } from "./json-input";
import { JYCMResultViewer } from "./jycm-result-viewer";

const safeJSONCallback = (value: string, cb: (v: string) => void) => {
  try {
    JSON.parse(value);
    return cb(value);
  } catch (e) {
    return false;
  }
};

function get_diff(leftStr: string, rightStr: string, configStr: string) {
  return get_jycm_instance_from_json(
    JSON.parse(leftStr),
    JSON.parse(rightStr),
    JSON.parse(configStr),
  ).get_diff(false);
}

function Demo() {
  const [leftJsonStr, setLeftJsonStr] = React.useState(
    JSON.stringify(defaultLeftJson),
  );
  const [rightJsonStr, setRightJsonStr] = React.useState(
    JSON.stringify(defaultRightJson),
  );

  const [jycmConfigStr, setJYCMConfigStr] = React.useState(
    JSON.stringify(defaultJYCMConfig),
  );

  const [diffResult, setJYCMResult] = React.useState<any>(
    get_diff(leftJsonStr, rightJsonStr, jycmConfigStr),
  );

  useEffect(() => {
    try {
      const result = get_diff(leftJsonStr, rightJsonStr, jycmConfigStr);

      setJYCMResult(result);
    } catch (e) {
      console.log("e", e);
    }
  }, [leftJsonStr, rightJsonStr, jycmConfigStr]);

  // use this can ave your time! see provider below
  const jycmContextValue = useJYCM({
    leftJsonStr,
    rightJsonStr,
    diffResult,
  });

  // In your component you can use all properties from jycm
  // using code
  // const jycmContext = useContext(JYCMContext)!;

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <h1 style={{ textAlign: "center" }}>
        JYCM Demo (
        <a href="https://github.com/eggachecat/jycm-viewer" target="_blank">
          Github
        </a>
        )
      </h1>
      <div style={{ height: "400px", width: "100%", display: "flex" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            width: "100%",
          }}
        >
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
            }}
          >
            <div style={{ textAlign: "center", fontWeight: 700 }}>
              [Input]Left Json
            </div>
            <div style={{ flexGrow: 1 }}>
              <JsonInput
                value={leftJsonStr}
                onChange={(v) => safeJSONCallback(v, setLeftJsonStr)}
              />
            </div>
          </div>
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
            }}
          >
            <div style={{ textAlign: "center", fontWeight: 700 }}>
              [Input]Right JSON
            </div>
            <div style={{ flexGrow: 1 }}>
              <JsonInput
                value={rightJsonStr}
                onChange={(v) => safeJSONCallback(v, setRightJsonStr)}
              />
            </div>
          </div>
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
            }}
          >
            <div style={{ textAlign: "center", fontWeight: 700 }}>
              [Input]Diff Rules
            </div>
            <div style={{ flexGrow: 1 }}>
              <JsonInput
                value={jycmConfigStr}
                onChange={(v) => safeJSONCallback(v, setJYCMConfigStr)}
              />
            </div>
          </div>
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
            }}
          >
            <div style={{ textAlign: "center", fontWeight: 700 }}>
              Diff Result
            </div>
            <div style={{ flexGrow: 1 }}>
              <JYCMResultViewer jycmResult={diffResult} />
            </div>
          </div>
        </div>
      </div>
      <h1 style={{ textAlign: "center" }}>Render</h1>

      <div
        style={{
          height: "800px",
          width: "100%",
          marginTop: "15px",
        }}
      >
        {/********** any component under this provider can have access to the diff etc. 
            You can control the editor very easy.   **********/}
        <JYCMContext.Provider value={jycmContextValue}>
          <div
            style={{ display: "flex", alignItems: "center", height: "100%" }}
          >
            <div style={{ flexGrow: 1, height: "100%" }}>
              <JYCMRender leftTitle="Left JSON" rightTitle="Right JSON" />
            </div>
            <div
              style={{
                flexBasis: "24%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ textAlign: "center", fontWeight: 700 }}>
                Diff Detail
              </div>
              <div style={{ flexGrow: 1 }}>
                <DiffDetailViewer />
              </div>
            </div>
          </div>
        </JYCMContext.Provider>
      </div>
    </div>
  );
}

export default Demo;
