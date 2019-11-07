import React from "react";
export function Smartphone(props) {
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
      className="smartphone_svg__feather smartphone_svg__feather-smartphone"
      {...props}
    >
      <rect x={5} y={2} width={14} height={20} rx={2} ry={2} />
      <path d="M12 18h.01" />
    </svg>
  );
}
