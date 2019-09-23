import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm1 2v14h16V5H4zm12.9 8A5.002 5.002 0 017 12a5.002 5.002 0 014-4.9V13h5.9zm0-2H13V7.1a5.006 5.006 0 013.9 3.9z" />
  </svg>
);