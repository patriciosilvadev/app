import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M22 6h-7a6 6 0 100 12h7v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1h18a1 1 0 011 1v2zm-7 2h8v8h-8a4 4 0 110-8zm0 3v2h3v-2h-3z" />
  </svg>
);
