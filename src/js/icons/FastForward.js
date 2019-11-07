import React from "react";
export function FastForward(props) {
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
      className="fast-forward_svg__feather fast-forward_svg__feather-fast-forward"
      {...props}
    >
      <path d="M13 19l9-7-9-7v14zM2 19l9-7-9-7v14z" />
    </svg>
  );
}
