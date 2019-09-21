import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M4.293 6.707L9 2h10a1 1 0 011 1v18a1 1 0 01-1 1H5a1 1 0 01-1-1V7.414a1 1 0 01.293-.707zM15 5v4h2V5h-2zm-3 0v4h2V5h-2zM9 5v4h2V5H9z" />
  </svg>
);
