import React from "react";
export function PieChart(props) {
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
      className="pie-chart_svg__feather pie-chart_svg__feather-pie-chart"
      {...props}
    >
      <path d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z" />
    </svg>
  );
}
