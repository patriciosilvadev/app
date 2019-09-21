import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M17 11V4h2v17h-2v-8H7v8H5V4h2v7z" />
  </svg>
);
