import React from "react";
export function Tablet(props) {
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
      className="tablet_svg__feather tablet_svg__feather-tablet"
      {...props}
    >
      <rect x={4} y={2} width={16} height={20} rx={2} ry={2} />
      <path d="M12 18h.01" />
    </svg>
  );
}
