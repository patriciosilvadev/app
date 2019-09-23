import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M20 7v14a1 1 0 01-1 1H5a1 1 0 01-1-1V7H2V5h20v2h-2zm-9 3v7h2v-7h-2zM7 2h10v2H7V2z" />
  </svg>
);