import React from "react";
export function PauseCircle(props) {
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
      className="pause-circle_svg__feather pause-circle_svg__feather-pause-circle"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M10 15V9M14 15V9" />
    </svg>
  );
}
