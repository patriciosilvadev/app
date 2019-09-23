import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M20 9V5H4v4h16zm0 2H4v8h16v-8zM3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm2 9h3v5H5v-5zm0-6h2v2H5V6zm4 0h2v2H9V6z" />
  </svg>
);