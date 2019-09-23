import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M17.5 21a3.5 3.5 0 110-7 3.5 3.5 0 010 7zm-11-11a3.5 3.5 0 110-7 3.5 3.5 0 010 7zm12.571-6.485l1.414 1.414L4.93 20.485l-1.414-1.414L19.07 3.515z" />
  </svg>
);