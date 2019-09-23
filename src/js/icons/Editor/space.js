import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M4 9v4h16V9h2v5a1 1 0 01-1 1H3a1 1 0 01-1-1V9h2z" />
  </svg>
);