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
  expect(container.textContent).toContain("JavaScript business function");
  expect(container.textContent).toContain("Rule outcomes");
  expect(container.textContent).toContain("Live visual diff");
  expect(container.textContent).toContain("Render");
  expect(container.textContent).toContain("− Removed / before");
  expect(container.textContent).toContain("+ Added / after");
  expect(container.textContent).toContain("Collapse Before / After");
  expect(container.querySelector('[data-testid="jycm-render"]')).not.toBeNull();
  expect(
    container.textContent!.indexOf("Render"),
  ).toBeLessThan(container.textContent!.indexOf("Business policy"));
  expect(container.querySelectorAll("textarea")).toHaveLength(4);

  const unifiedButton = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === "Unified Git diff",
  )!;
  act(() => {
    unifiedButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(container.textContent).toContain("before.json → after.json");

  cleanup(container);
});
