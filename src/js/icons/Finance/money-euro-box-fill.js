import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm7.05 8a2.5 2.5 0 014.064-1.41l1.701-1.133A4.5 4.5 0 008.028 11H7v2h1.027a4.5 4.5 0 007.788 2.543l-1.701-1.134A2.5 2.5 0 0110.05 13l4.95.001v-2h-4.95z" />
  </svg>
);
