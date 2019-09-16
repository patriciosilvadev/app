import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M8.889 16H5a1 1 0 01-1-1V9a1 1 0 011-1h3.889l5.294-4.332a.5.5 0 01.817.387v15.89a.5.5 0 01-.817.387L8.89 16zm9.974.591l-1.422-1.422A3.993 3.993 0 0019 12c0-1.43-.75-2.685-1.88-3.392l1.439-1.439A5.991 5.991 0 0121 12c0 1.842-.83 3.49-2.137 4.591z" />
  </svg>
);
