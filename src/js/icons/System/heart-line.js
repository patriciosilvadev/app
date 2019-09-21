import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12 22l-9.192-9.192c-2.18-2.568-2.066-6.42.353-8.84A6.5 6.5 0 0112 3.64a6.5 6.5 0 019.179 9.154L12 22zm7.662-10.509a4.5 4.5 0 00-6.355-6.337L12 6.282l-1.307-1.128a4.5 4.5 0 00-6.355 6.337l.114.132L12 19.172l7.548-7.549.114-.132z" />
  </svg>
);
