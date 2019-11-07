import React from "react";
export function Pocket(props) {
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
      className="pocket_svg__feather pocket_svg__feather-pocket"
      {...props}
    >
      <path d="M4 3h16a2 2 0 012 2v6a10 10 0 01-10 10A10 10 0 012 11V5a2 2 0 012-2z" />
      <path d="M8 10l4 4 4-4" />
    </svg>
  );
}
