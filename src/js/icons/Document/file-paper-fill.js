import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M3 15V3a1 1 0 011-1h16a1 1 0 011 1v16a3 3 0 01-3 3H4a3 3 0 01-3-3v-2h16v2a1 1 0 002 0v-4H3z" />
  </svg>
);