import React from "react";
export function CornerRightUp(props) {
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
      className="corner-right-up_svg__feather corner-right-up_svg__feather-corner-right-up"
      {...props}
    >
      <path d="M10 9l5-5 5 5" />
      <path d="M4 20h7a4 4 0 004-4V4" />
    </svg>
  );
}
