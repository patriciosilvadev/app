import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M3 19h18v2H3v-2zm10-9v8h-2v-8H4l8-8 8 8h-7z" />
  </svg>
);