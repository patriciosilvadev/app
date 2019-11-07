import React from "react";
export function Umbrella(props) {
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
      className="umbrella_svg__feather umbrella_svg__feather-umbrella"
      {...props}
    >
      <path d="M23 12a11.05 11.05 0 00-22 0zm-5 7a3 3 0 01-6 0v-7" />
    </svg>
  );
}
