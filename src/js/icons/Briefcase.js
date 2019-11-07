import React from "react";
export function Briefcase(props) {
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
      className="briefcase_svg__feather briefcase_svg__feather-briefcase"
      {...props}
    >
      <rect x={2} y={7} width={20} height={14} rx={2} ry={2} />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}
