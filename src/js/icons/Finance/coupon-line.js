import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M2 9.5V4a1 1 0 011-1h18a1 1 0 011 1v5.5a2.5 2.5 0 100 5V20a1 1 0 01-1 1H3a1 1 0 01-1-1v-5.5a2.5 2.5 0 100-5zm2-1.532a4.5 4.5 0 010 8.064V19h16v-2.968a4.5 4.5 0 010-8.064V5H4v2.968zM9 9h6v2H9V9zm0 4h6v2H9v-2z" />
  </svg>
);