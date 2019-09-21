import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M13 18v2h4v2H7v-2h4v-2H3a1 1 0 01-1-1V4a1 1 0 011-1h18a1 1 0 011 1v13a1 1 0 01-1 1h-8zM10 7.5v6l5-3-5-3z" />
  </svg>
);
