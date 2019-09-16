import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M13 8v8a3 3 0 01-3 3H7.83a3.001 3.001 0 110-2H10a1 1 0 001-1V8a3 3 0 013-3h3V2l5 4-5 4V7h-3a1 1 0 00-1 1z" />
  </svg>
);
