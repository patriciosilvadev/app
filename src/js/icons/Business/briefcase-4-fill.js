import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M9 13v3h6v-3h7v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7h7zm2-2h2v3h-2v-3zM7 5V2a1 1 0 011-1h8a1 1 0 011 1v3h4a1 1 0 011 1v5h-7V9H9v2H2V6a1 1 0 011-1h4zm2-2v2h6V3H9z" />
  </svg>
);
