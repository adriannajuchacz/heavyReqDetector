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

//import unsorted_points from '../data/unsorted_points_with_injection.json';
import unsorted_points from '../data/unsorted_points_without_injection.json';

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
          <XAxis dataKey="interval_no" />
          <YAxis/>
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="cpuValue"
            stroke="#eb4034"
            activeDot={{ r: 8 }}
          />
          <Line type="monotone" dataKey="expectedValue" stroke="#1c19bf" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
