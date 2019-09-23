import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M5 20h14v2H5v-2zm7-2a8 8 0 110-16 8 8 0 010 16z" />
  </svg>
);