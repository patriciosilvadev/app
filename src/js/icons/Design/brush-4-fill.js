import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M20 16H4v2h16v-2zM3 14V4a1 1 0 011-1h3v8.273h2V3h11a1 1 0 011 1v10h1v5a1 1 0 01-1 1h-8v3h-2v-3H3a1 1 0 01-1-1v-5h1z" />
  </svg>
);