import React from "react";
export function Type(props) {
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
      className="type_svg__feather type_svg__feather-type"
      {...props}
    >
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  );
}
