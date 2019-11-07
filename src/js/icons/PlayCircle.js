import React from "react";
export function PlayCircle(props) {
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
      className="play-circle_svg__feather play-circle_svg__feather-play-circle"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M10 8l6 4-6 4V8z" />
    </svg>
  );
}
