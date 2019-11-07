import React from "react";
export function Airplay(props) {
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
      className="airplay_svg__feather airplay_svg__feather-airplay"
      {...props}
    >
      <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
      <path d="M12 15l5 6H7l5-6z" />
    </svg>
  );
}
