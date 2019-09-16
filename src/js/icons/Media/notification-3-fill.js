import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M20 17h2v2H2v-2h2v-7a8 8 0 1116 0v7zM9 21h6v2H9v-2z" />
  </svg>
);
