import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12.414 5H21a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1h7.414l2 2zM15 13v-1a3 3 0 00-6 0v1H8v4h8v-4h-1zm-2 0h-2v-1a1 1 0 012 0v1z" />
  </svg>
);