import React from "react";
export function Music(props) {
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
      className="music_svg__feather music_svg__feather-music"
      {...props}
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx={6} cy={18} r={3} />
      <circle cx={18} cy={16} r={3} />
    </svg>
  );
}
