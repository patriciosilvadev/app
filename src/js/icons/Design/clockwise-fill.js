import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M20 10h3l-4 5-4-5h3V8a3 3 0 00-3-3h-4V3h4a5 5 0 015 5v2zm-7-1a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V10a1 1 0 011-1h10z" />
  </svg>
);