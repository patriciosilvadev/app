import React from "react";
export function AlignCenter(props) {
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
      className="align-center_svg__feather align-center_svg__feather-align-center"
      {...props}
    >
      <path d="M18 10H6M21 6H3M21 14H3M18 18H6" />
    </svg>
  );
}
