import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M17.657 15.657L12 21.314l-5.657-5.657a8 8 0 1111.314 0zM5 22h14v2H5v-2z" />
  </svg>
);
