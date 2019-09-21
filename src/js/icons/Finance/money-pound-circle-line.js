import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-3-7H8v-2h1v-1a3.5 3.5 0 016.746-1.311l-1.986.496A1.499 1.499 0 0011 10v1h3v2h-3v2h5v2H8v-2h1v-2z" />
  </svg>
);
