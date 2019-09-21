import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M21 4H7a2 2 0 100 4h14v13a1 1 0 01-1 1H7a4 4 0 01-4-4V6a4 4 0 014-4h13a1 1 0 011 1v1zm-1 3H7a1 1 0 110-2h13v2z" />
  </svg>
);
