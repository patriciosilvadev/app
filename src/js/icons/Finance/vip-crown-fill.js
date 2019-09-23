import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M2 19h20v2H2v-2zM2 5l5 3 5-6 5 6 5-3v12H2V5z" />
  </svg>
);