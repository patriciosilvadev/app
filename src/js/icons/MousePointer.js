import React from "react";
export function MousePointer(props) {
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
      className="mouse-pointer_svg__feather mouse-pointer_svg__feather-mouse-pointer"
      {...props}
    >
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3zM13 13l6 6" />
    </svg>
  );
}
