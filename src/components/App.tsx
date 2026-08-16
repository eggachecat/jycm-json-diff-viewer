import { hot } from "react-hot-loader";
import Demo from "./Demo";

import "./../assets/scss/App.scss";

declare let module: Record<string, unknown>;

export default hot(module)(Demo);
