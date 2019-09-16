import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M2 6c0-.552.455-1 .992-1h18.016c.548 0 .992.445.992 1v14c0 .552-.455 1-.992 1H2.992A.994.994 0 012 20V6zm12 12a5 5 0 100-10 5 5 0 000 10zM4 7v2h3V7H4zm0-5h6v2H4V2z" />
  </svg>
);
