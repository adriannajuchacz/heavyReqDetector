import React, { PureComponent } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import iteratorAndEndpointCount from '../data/endpointDistribution_iteratorAndEndpointCount.json';
import iteratorAndEndpointRatio from '../data/endpointDistribution_iteratorAndEndpointRatio.json';
import endpointsWithColors from '../data/endpointsWithColors.json';

export default class EndpointDistribution extends PureComponent {
  render() {
    return (
      <div>
        <div style={{ width: '100%', height: '100vh' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              width={500}
              height={300}
              data={iteratorAndEndpointCount}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="multipleOfMedian" />
              <YAxis />
              <Tooltip />
              <Legend />
              {endpointsWithColors.map(endpoint => (
                <Bar dataKey={endpoint.url} stackId="a" fill={endpoint.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ width: '100%', height: '100vh' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              width={500}
              height={300}
              data={iteratorAndEndpointRatio}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="multipleOfMedian" />
              <YAxis />
              <Tooltip />
              <Legend />
              {endpointsWithColors.map(endpoint => (
                <Bar dataKey={endpoint.url} stackId="a" fill={endpoint.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    );
  }
}