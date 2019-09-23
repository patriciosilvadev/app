import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M20 11V8h-6V4h-4v4H4v3h16zm1 2v8a1 1 0 01-1 1H10v-6H8v6H4a1 1 0 01-1-1v-8H2V7a1 1 0 011-1h5V3a1 1 0 011-1h6a1 1 0 011 1v3h5a1 1 0 011 1v6h-1z" />
  </svg>
);