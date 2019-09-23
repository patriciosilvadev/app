import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M17 21v-4H7v4H5v-5a1 1 0 011-1h12a1 1 0 011 1v5h-2zM7 3v4h10V3h2v5a1 1 0 01-1 1H6a1 1 0 01-1-1V3h2zM2 9l4 3-4 3V9zm20 0v6l-4-3 4-3z" />
  </svg>
);