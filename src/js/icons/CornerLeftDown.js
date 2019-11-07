import React from "react";
export function CornerLeftDown(props) {
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
      className="corner-left-down_svg__feather corner-left-down_svg__feather-corner-left-down"
      {...props}
    >
      <path d="M14 15l-5 5-5-5" />
      <path d="M20 4h-7a4 4 0 00-4 4v12" />
    </svg>
  );
}
