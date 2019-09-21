import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M6 3h7a6 6 0 110 12h-3v6H6V3zm4 4v4h3a2 2 0 100-4h-3z" />
  </svg>
);
