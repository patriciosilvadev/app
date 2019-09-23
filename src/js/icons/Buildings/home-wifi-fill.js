import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M20 20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9H1l10.327-9.388a1 1 0 011.346 0L23 11h-3v9zM7 11v2a5 5 0 015 5h2a7 7 0 00-7-7zm0 4v3h3a3 3 0 00-3-3z" />
  </svg>
);