import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M9 3v2H4v14h16v-9h2v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1h6zm7 2V1l7 6h-9a2 2 0 00-2 2v6h-2V9a4 4 0 014-4h2z" />
  </svg>
);