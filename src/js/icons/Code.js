import React from "react";
export function Code(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={props.size}
      height={props.size}
      fill="none"
      stroke={props.color}
      strokeWidth={props.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="code_svg__feather code_svg__feather-code"
      {...props}
    >
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  );
}
