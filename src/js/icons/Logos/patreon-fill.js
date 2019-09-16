import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M15 17a7.5 7.5 0 110-15 7.5 7.5 0 010 15zM2 2h4v20H2V2z" />
  </svg>
);
