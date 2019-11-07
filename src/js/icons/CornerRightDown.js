import React from "react";
export function CornerRightDown(props) {
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
      className="corner-right-down_svg__feather corner-right-down_svg__feather-corner-right-down"
      {...props}
    >
      <path d="M10 15l5 5 5-5" />
      <path d="M4 4h7a4 4 0 014 4v12" />
    </svg>
  );
}
