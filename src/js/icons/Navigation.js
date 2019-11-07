import React from "react";
export function Navigation(props) {
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
      className="navigation_svg__feather navigation_svg__feather-navigation"
      {...props}
    >
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  );
}
