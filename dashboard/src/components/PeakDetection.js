import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";


import sorted_peaks from '../data/sorted_points.json';

export default function PeakDetection() {
  return (
    <div style={{ width: '100%', height: '90vh' }}>
      <h3>This view shows the timestamps sorted based on the Actual CPU to Expected CPU ratio</h3>
      <h4>The first timestamps (PEAKS) have the worst CPU performance</h4>
      <h4>The last timestamps (NON-PEAKS) have the best CPU performance</h4>
      <ResponsiveContainer>
        <LineChart
          width={500}
          height={300}
          data={sorted_peaks}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="cpuValue"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
          <Line type="monotone" dataKey="expectedValue" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
