import React from "react";
export function Crosshair(props) {
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
      className="crosshair_svg__feather crosshair_svg__feather-crosshair"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M22 12h-4M6 12H2M12 6V2M12 22v-4" />
    </svg>
  );
}
