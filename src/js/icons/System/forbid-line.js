import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zM8.523 7.109l8.368 8.368a6.04 6.04 0 01-1.414 1.414L7.109 8.523A6.04 6.04 0 018.523 7.11z" />
  </svg>
);
