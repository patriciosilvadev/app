import React from "react";
export function Bluetooth(props) {
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
      className="bluetooth_svg__feather bluetooth_svg__feather-bluetooth"
      {...props}
    >
      <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11" />
    </svg>
  );
}
