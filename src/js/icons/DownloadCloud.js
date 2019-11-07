import React from "react";
export function DownloadCloud(props) {
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
      className="download-cloud_svg__feather download-cloud_svg__feather-download-cloud"
      {...props}
    >
      <path d="M8 17l4 4 4-4M12 12v9" />
      <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29" />
    </svg>
  );
}
