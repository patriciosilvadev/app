import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M11.608 3H21a1 1 0 011 1v12a1 1 0 01-1 1h-7v-2h6V5h-6.255A6.968 6.968 0 0115 9a6.992 6.992 0 01-3 5.745V21a1 1 0 01-1 1H5a1 1 0 01-1-1v-6.255A7 7 0 1111.608 3zM6 13.584V20h4v-6.416a5.001 5.001 0 10-4 0zM8 12a3 3 0 110-6 3 3 0 010 6zm0-2a1 1 0 100-2 1 1 0 000 2zm9-3h2v2h-2V7zM7 17h2v2H7v-2z" />
  </svg>
);
