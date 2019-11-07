import React from "react";
export function CornerDownLeft(props) {
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
      className="corner-down-left_svg__feather corner-down-left_svg__feather-corner-down-left"
      {...props}
    >
      <path d="M9 10l-5 5 5 5" />
      <path d="M20 4v7a4 4 0 01-4 4H4" />
    </svg>
  );
}
