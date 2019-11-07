import React from "react";
export function X(props) {
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
      className="x_svg__feather x_svg__feather-x"
      {...props}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
