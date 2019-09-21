import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M6 5h2v14H6V5zm10 0h2v14h-2V5z" />
  </svg>
);
