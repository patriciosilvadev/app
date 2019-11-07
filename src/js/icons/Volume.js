import React from "react";
export function Volume(props) {
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
      className="volume_svg__feather volume_svg__feather-volume"
      {...props}
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
    </svg>
  );
}
