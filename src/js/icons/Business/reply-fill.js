import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M11 14v5L1 11l10-8v5c5.523 0 10 4.477 10 10 0 .273-.01.543-.032.81A8.999 8.999 0 0013 14h-2z" />
  </svg>
);
