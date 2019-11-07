import React from "react";
export function Play(props) {
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
      className="play_svg__feather play_svg__feather-play"
      {...props}
    >
      <path d="M5 3l14 9-14 9V3z" />
    </svg>
  );
}
