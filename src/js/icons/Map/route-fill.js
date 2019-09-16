import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M4 15V8.5a4.5 4.5 0 019 0v7a2.5 2.5 0 105 0V8.83a3.001 3.001 0 112 0v6.67a4.5 4.5 0 11-9 0v-7a2.5 2.5 0 00-5 0V15h3l-4 5-4-5h3z" />
  </svg>
);
