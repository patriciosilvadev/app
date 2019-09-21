import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M22 7H2V4a1 1 0 011-1h18a1 1 0 011 1v3zm0 2v11a1 1 0 01-1 1H3a1 1 0 01-1-1V9h20zm-11 5v-2.5L6.5 16H17v-2h-6z" />
  </svg>
);
