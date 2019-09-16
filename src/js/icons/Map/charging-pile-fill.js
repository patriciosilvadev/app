import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M3 19V4a1 1 0 011-1h9a1 1 0 011 1v8h2a2 2 0 012 2v4a1 1 0 002 0v-7h-2a1 1 0 01-1-1V6.414l-1.657-1.657 1.414-1.414 4.95 4.95A.997.997 0 0122 9v9a3 3 0 01-6 0v-4h-2v5h1v2H2v-2h1zm6-8V7l-4 6h3v4l4-6H9z" />
  </svg>
);
