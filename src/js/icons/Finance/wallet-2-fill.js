import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M22 8h-9a1 1 0 00-1 1v6a1 1 0 001 1h9v4a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1h18a1 1 0 011 1v4zm-7 3h3v2h-3v-2z" />
  </svg>
);
