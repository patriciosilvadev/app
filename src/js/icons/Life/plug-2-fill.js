import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M13 18v2h6v2h-6a2 2 0 01-2-2v-2H8a4 4 0 01-4-4v-4h16v4a4 4 0 01-4 4h-3zm4-12h2a1 1 0 011 1v2H4V7a1 1 0 011-1h2V2h2v4h6V2h2v4zm-5 8.5a1 1 0 100-2 1 1 0 000 2zM11 2h2v3h-2V2z" />
  </svg>
);