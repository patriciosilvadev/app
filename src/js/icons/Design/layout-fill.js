import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M16 21V10h5v10a1 1 0 01-1 1h-4zm-2 0H4a1 1 0 01-1-1V10h11v11zm7-13H3V4a1 1 0 011-1h16a1 1 0 011 1v4z" />
  </svg>
);
