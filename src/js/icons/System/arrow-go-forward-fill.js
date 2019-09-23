import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M16 7h-5a6 6 0 100 12h9v2h-9a8 8 0 110-16h5V1l6 5-6 5V7z" />
  </svg>
);