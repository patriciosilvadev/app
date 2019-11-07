import React from "react";
export function Pause(props) {
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
      className="pause_svg__feather pause_svg__feather-pause"
      {...props}
    >
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  );
}
