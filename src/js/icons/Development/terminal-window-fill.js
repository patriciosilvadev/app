import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M20 10H4v9h16v-9zM3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm2 3v2h2V6H5zm4 0v2h2V6H9zm-4 5h3v5H5v-5z" />
  </svg>
);
