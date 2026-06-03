'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';

interface ChartWrapperProps {
  option: any;
  style?: React.CSSProperties;
  className?: string;
}

export default function ChartWrapper({ option, style, className = '' }: ChartWrapperProps) {
  return (
    <div className={`w-full ${className}`} style={{ height: '350px', ...style }}>
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
