import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M14 15v7h-4v-7L5.333 8h13.334L14 15zm7-9H3V4h18v2z" />
  </svg>
);
