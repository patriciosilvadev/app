import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M21 14v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a2 2 0 100-4V3a1 1 0 011-1h16a1 1 0 011 1v7a2 2 0 100 4zM9 6v2h6V6H9zm0 10v2h6v-2H9z" />
  </svg>
);
