import React from "react";
export function Italic(props) {
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
      className="italic_svg__feather italic_svg__feather-italic"
      {...props}
    >
      <path d="M19 4h-9M14 20H5M15 4L9 20" />
    </svg>
  );
}
