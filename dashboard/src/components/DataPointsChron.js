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

import unsorted_points from '../data/unsorted_points.json';

export default function DataPointsChron() {
  return (
    <div style={{ width: '100%', height: '90vh' }}>
      <h3>This view shows the timestamps with actual CPU and expected CPU, sorted chronogically</h3>
      <ResponsiveContainer>
        <LineChart
          width={500}
          height={300}
          data={unsorted_points}
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
