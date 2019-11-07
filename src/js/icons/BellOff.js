import React from "react";
export function BellOff(props) {
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
      className="bell-off_svg__feather bell-off_svg__feather-bell-off"
      {...props}
    >
      <path d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-5M1 1l22 22" />
    </svg>
  );
}
