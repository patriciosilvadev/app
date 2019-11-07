import React from "react";
export function Layout(props) {
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
      className="layout_svg__feather layout_svg__feather-layout"
      {...props}
    >
      <rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}
