import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M22 13.341A6 6 0 0014.341 21H3a1 1 0 01-1-1V4a1 1 0 011-1h18a1 1 0 011 1v9.341zm-9.94-1.658L5.648 6.238 4.353 7.762l7.72 6.555 7.581-6.56-1.308-1.513-6.285 5.439zm4.99 7.865a3.017 3.017 0 010-1.096l-1.014-.586 1-1.732 1.014.586c.278-.238.599-.425.95-.55V15h2v1.17c.351.125.672.312.95.55l1.014-.586 1 1.732-1.014.586a3.017 3.017 0 010 1.096l1.014.586-1 1.732-1.014-.586a2.997 2.997 0 01-.95.55V23h-2v-1.17a2.997 2.997 0 01-.95-.55l-1.014.586-1-1.732 1.014-.586zM20 20a1 1 0 100-2 1 1 0 000 2z" />
  </svg>
);
