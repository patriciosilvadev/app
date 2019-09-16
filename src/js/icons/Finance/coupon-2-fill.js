import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M14 3v18H3a1 1 0 01-1-1v-5.5a2.5 2.5 0 100-5V4a1 1 0 011-1h11zm2 0h5a1 1 0 011 1v5.5a2.5 2.5 0 100 5V20a1 1 0 01-1 1h-5V3z" />
  </svg>
);
