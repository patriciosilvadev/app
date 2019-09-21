import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M10 4V1l5 4-5 4V6H8a3 3 0 00-3 3v4H3V9a5 5 0 015-5h2zm-1 7a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H10a1 1 0 01-1-1V11z" />
  </svg>
);
