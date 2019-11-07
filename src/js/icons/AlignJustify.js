import React from "react";
export function AlignJustify(props) {
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
      className="align-justify_svg__feather align-justify_svg__feather-align-justify"
      {...props}
    >
      <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
    </svg>
  );
}
