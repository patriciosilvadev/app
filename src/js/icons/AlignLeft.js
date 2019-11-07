import React from "react";
export function AlignLeft(props) {
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
      className="align-left_svg__feather align-left_svg__feather-align-left"
      {...props}
    >
      <path d="M17 10H3M21 6H3M21 14H3M17 18H3" />
    </svg>
  );
}
