import React from "react";
export function Save(props) {
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
      className="save_svg__feather save_svg__feather-save"
      {...props}
    >
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}
