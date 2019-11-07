import React from "react";
export function SkipForward(props) {
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
      className="skip-forward_svg__feather skip-forward_svg__feather-skip-forward"
      {...props}
    >
      <path d="M5 4l10 8-10 8V4zM19 5v14" />
    </svg>
  );
}
