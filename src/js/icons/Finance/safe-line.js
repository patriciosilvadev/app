import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M18 20H6v2H4v-2H3a1 1 0 01-1-1V4a1 1 0 011-1h18a1 1 0 011 1v15a1 1 0 01-1 1h-1v2h-2v-2zM4 18h16V5H4v13zm9-4.126V17h-2v-3.126A4.002 4.002 0 0112 6a4 4 0 011 7.874zM12 12a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);