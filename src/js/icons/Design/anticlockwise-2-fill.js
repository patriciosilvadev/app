import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M14 4h2a5 5 0 015 5v4h-2V9a3 3 0 00-3-3h-2v3L9 5l5-4v3zm1 7v10a1 1 0 01-1 1H4a1 1 0 01-1-1V11a1 1 0 011-1h10a1 1 0 011 1z" />
  </svg>
);
