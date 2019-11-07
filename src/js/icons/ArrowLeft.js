import React from "react";
export function ArrowLeft(props) {
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
      className="arrow-left_svg__feather arrow-left_svg__feather-arrow-left"
      {...props}
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
