import React from "react";
export function BarChart2(props) {
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
      className="bar-chart-2_svg__feather bar-chart-2_svg__feather-bar-chart-2"
      {...props}
    >
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}
