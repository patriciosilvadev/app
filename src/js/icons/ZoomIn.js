import React from "react";
export function ZoomIn(props) {
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
      className="zoom-in_svg__feather zoom-in_svg__feather-zoom-in"
      {...props}
    >
      <circle cx={11} cy={11} r={8} />
      <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </svg>
  );
}
