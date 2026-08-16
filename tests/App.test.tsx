import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";

import App from "../src/components/App";
import SemanticDiffWorkspace from "../src/components/semantic-diff-workspace";

const render = (element: React.ReactElement) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    ReactDOM.render(element, container);
  });
  return container;
};

const cleanup = (container: HTMLDivElement) => {
  act(() => {
    ReactDOM.unmountComponentAtNode(container);
  });
  container.remove();
};

it("renders the product landing page before the editor chunk loads", () => {
  const container = render(<App />);

  expect(container.textContent).toContain(
    "Compare JSON by what your business actually means.",
  );
  expect(container.textContent).toContain("Loading playground");
  expect(container.textContent).toContain("API regression");

  cleanup(container);
});

it("renders the semantic diff workspace", () => {
  const container = render(<SemanticDiffWorkspace />);

  expect(container.textContent).toContain("Business policy");
  expect(container.textContent).toContain("Semantic JSON Patch");
  expect(container.textContent).toContain("Rule outcomes");
  expect(container.textContent).toContain("Synchronized inspection");
  expect(container.querySelectorAll("textarea")).toHaveLength(5);

  cleanup(container);
});
