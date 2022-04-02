import React, { PureComponent } from 'react';
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

//import burdensomeness_scores from '../data/burdensomeness_scores_without_injection.json';
import burdensomeness_scores from '../data/burdensomeness_scores_with_injection.json';

export default class BurdensomenessScore extends PureComponent {
    render() {
        return (
            <div>
                <div style={{ width: '100%', height: '100vh' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            width={500}
                            height={300}
                            data={burdensomeness_scores}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="url" />
                            <YAxis />
                            <Tooltip />

                            <Bar dataKey="burdensomeness_score" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        );
    }
}