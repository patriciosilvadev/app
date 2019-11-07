import React from "react";
export function Slash(props) {
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
      className="slash_svg__feather slash_svg__feather-slash"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M4.93 4.93l14.14 14.14" />
    </svg>
  );
}
