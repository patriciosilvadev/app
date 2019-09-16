import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M15 21H9V10h6v11zm2 0V10h5v10a1 1 0 01-1 1h-4zM7 21H3a1 1 0 01-1-1V10h5v11zM22 8H2V4a1 1 0 011-1h18a1 1 0 011 1v4z" />
  </svg>
);
