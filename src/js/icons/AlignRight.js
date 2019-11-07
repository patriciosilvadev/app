import React from "react";
export function AlignRight(props) {
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
      className="align-right_svg__feather align-right_svg__feather-align-right"
      {...props}
    >
      <path d="M21 10H7M21 6H3M21 14H3M21 18H7" />
    </svg>
  );
}
