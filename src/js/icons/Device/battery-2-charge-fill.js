import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1h3a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1h3zm4 8V7l-5 7h3v5l5-7h-3z" />
  </svg>
);