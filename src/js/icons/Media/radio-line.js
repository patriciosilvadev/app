import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M17 10V8h-2v2H5V6h14v4h-2zM6 3V1h2v2h13.008c.548 0 .992.445.992.993v16.014a1 1 0 01-.992.993H2.992A.993.993 0 012 20.007V3.993A1 1 0 012.992 3H6zM4 5v14h16V5H4zm4 13a3 3 0 110-6 3 3 0 010 6z" />
  </svg>
);
