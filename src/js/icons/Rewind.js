import React from "react";
export function Rewind(props) {
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
      className="rewind_svg__feather rewind_svg__feather-rewind"
      {...props}
    >
      <path d="M11 19l-9-7 9-7v14zM22 19l-9-7 9-7v14z" />
    </svg>
  );
}
