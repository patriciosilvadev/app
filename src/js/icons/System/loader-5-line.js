import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12 3a9 9 0 019 9h-2a7 7 0 00-7-7V3z" />
  </svg>
);
