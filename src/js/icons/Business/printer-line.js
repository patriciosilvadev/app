import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M6 19H3a1 1 0 01-1-1V8a1 1 0 011-1h3V3a1 1 0 011-1h10a1 1 0 011 1v4h3a1 1 0 011 1v10a1 1 0 01-1 1h-3v2a1 1 0 01-1 1H7a1 1 0 01-1-1v-2zm0-2v-1a1 1 0 011-1h10a1 1 0 011 1v1h2V9H4v8h2zM8 4v3h8V4H8zm0 13v3h8v-3H8zm-3-7h3v2H5v-2z" />
  </svg>
);