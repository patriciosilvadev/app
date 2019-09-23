import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M14 3v2H4v13.385L5.763 17H20v-7h2v8a1 1 0 01-1 1H6.455L2 22.5V4a1 1 0 011-1h11zm5 0V0h2v3h3v2h-3v3h-2V5h-3V3h3z" />
  </svg>
);