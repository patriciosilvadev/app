import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12 6v15h-2v-5a6 6 0 110-12h10v2h-3v15h-2V6h-3zm-2 0a4 4 0 100 8V6z" />
  </svg>
);
