import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M6 7V4a1 1 0 011-1h6.414l2 2H21a1 1 0 011 1v10a1 1 0 01-1 1h-3v3a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1h3zm0 2H4v10h12v-2H6V9z" />
  </svg>
);