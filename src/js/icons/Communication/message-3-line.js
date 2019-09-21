import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M2 8.994A5.99 5.99 0 018 3h8c3.313 0 6 2.695 6 5.994V21H8c-3.313 0-6-2.695-6-5.994V8.994zM20 19V8.994A4.004 4.004 0 0016 5H8a3.99 3.99 0 00-4 3.994v6.012A4.004 4.004 0 008 19h12zm-6-8h2v2h-2v-2zm-6 0h2v2H8v-2z" />
  </svg>
);
