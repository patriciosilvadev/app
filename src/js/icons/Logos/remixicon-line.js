import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M6.364 6l8.784 9.663.72-.283c1.685-.661 2.864-2.156 3.092-3.896A6.502 6.502 0 0112.077 6H6.363zM14 5a4.5 4.5 0 006.714 3.918c.186.618.286 1.271.286 1.947 0 2.891-1.822 5.364-4.4 6.377L20 21H3V4h11.111A4.515 4.515 0 0014 5zm4.5 2.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5zM5 7.47V19h10.48L5 7.47z" />
  </svg>
);
