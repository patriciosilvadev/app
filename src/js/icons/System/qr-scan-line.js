import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M21 16v5H3v-5h2v3h14v-3h2zM3 11h18v2H3v-2zm18-3h-2V5H5v3H3V3h18v5z" />
  </svg>
);