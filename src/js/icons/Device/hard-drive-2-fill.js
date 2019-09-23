import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M21 3v18a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1h16a1 1 0 011 1zM5 16v4h14v-4H5zm10 1h2v2h-2v-2z" />
  </svg>
);