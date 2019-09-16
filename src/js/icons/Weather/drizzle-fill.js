import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M11 18v3H9v-3a8 8 0 117.458-10.901A5.5 5.5 0 1117.5 18H11zm2 2h2v3h-2v-3z" />
  </svg>
);
