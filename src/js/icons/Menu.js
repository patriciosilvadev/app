import React from "react";
export function Menu(props) {
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
      className="menu_svg__feather menu_svg__feather-menu"
      {...props}
    >
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}
