import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M19 17h3v2h-3v3h-2v-3H6a1 1 0 01-1-1V7H2V5h3V2h2v3h11a1 1 0 011 1v11z" />
  </svg>
);
