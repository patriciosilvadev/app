import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M4 19h16v-5h2v6a1 1 0 01-1 1H3a1 1 0 01-1-1v-6h2v5zm8-9H9a5.992 5.992 0 00-4.854 2.473A8.003 8.003 0 0112 6V2l8 6-8 6v-4z" />
  </svg>
);