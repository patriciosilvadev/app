import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M8.414 17H15v2H6a1 1 0 01-1-1V7H2V5h3V2h2v13.586L15.586 7H9V5h8.586l2.556-2.556 1.414 1.414L19 6.414V17h3v2h-3v3h-2V8.414L8.414 17z" />
  </svg>
);