import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M10 21H3a1 1 0 01-1-1V4a1 1 0 011-1h7a2 2 0 104 0h7a1 1 0 011 1v16a1 1 0 01-1 1h-7a2 2 0 10-4 0zM6 8v8h2V8H6zm10 0v8h2V8h-2z" />
  </svg>
);
