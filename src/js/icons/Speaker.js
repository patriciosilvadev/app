import React from "react";
export function Speaker(props) {
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
      className="speaker_svg__feather speaker_svg__feather-speaker"
      {...props}
    >
      <rect x={4} y={2} width={16} height={20} rx={2} ry={2} />
      <circle cx={12} cy={14} r={4} />
      <path d="M12 6h.01" />
    </svg>
  );
}
