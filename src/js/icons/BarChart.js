import React from "react";
export function BarChart(props) {
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
      className="bar-chart_svg__feather bar-chart_svg__feather-bar-chart"
      {...props}
    >
      <path d="M12 20V10M18 20V4M6 20v-4" />
    </svg>
  );
}
