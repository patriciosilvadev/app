import React from "react";
export function Film(props) {
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
      className="film_svg__feather film_svg__feather-film"
      {...props}
    >
      <rect x={2} y={2} width={20} height={20} rx={2.18} ry={2.18} />
      <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
    </svg>
  );
}
