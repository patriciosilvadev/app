import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M20 3v14a4 4 0 11-2-3.465V6H9v11a4 4 0 11-2-3.465V3h13z" />
  </svg>
);
