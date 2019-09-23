import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm8.126 9H4v7h16v-7h-1.126a4.002 4.002 0 01-7.748 0zm0-2a4.002 4.002 0 017.748 0H20V5H4v5h7.126zM15 13a2 2 0 100-4 2 2 0 000 4zm-9 2h2v2H6v-2z" />
  </svg>
);