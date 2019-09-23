import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M22 10v10a1 1 0 01-1 1H3a1 1 0 01-1-1V10h20zm0-2H2V4a1 1 0 011-1h18a1 1 0 011 1v4zm-7 8v2h4v-2h-4z" />
  </svg>
);