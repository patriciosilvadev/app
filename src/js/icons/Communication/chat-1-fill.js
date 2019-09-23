import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M10 3h4a8 8 0 110 16v3.5c-5-2-12-5-12-11.5a8 8 0 018-8z" />
  </svg>
);