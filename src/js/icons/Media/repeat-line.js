import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M6 4h15a1 1 0 011 1v7h-2V6H6v3L1 5l5-4v3zm12 16H3a1 1 0 01-1-1v-7h2v6h14v-3l5 4-5 4v-3z" />
  </svg>
);