import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12 19h2V6l6.394 2.74a1 1 0 01.606.92V19h2v2H1v-2h2V5.65a1 1 0 01.594-.914l7.703-3.424A.5.5 0 0112 1.77V19z" />
  </svg>
);