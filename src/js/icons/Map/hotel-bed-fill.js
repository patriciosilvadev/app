import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M22 11v9h-2v-3H4v3H2V4h2v10h8V7h6a4 4 0 014 4zM8 13a3 3 0 110-6 3 3 0 010 6z" />
  </svg>
);