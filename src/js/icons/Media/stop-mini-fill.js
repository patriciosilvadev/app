import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M6 7v10a1 1 0 001 1h10a1 1 0 001-1V7a1 1 0 00-1-1H7a1 1 0 00-1 1z" />
  </svg>
);
