import React from 'react'

import 'bootstrap/dist/css/bootstrap.min.css';

import BTable from 'react-bootstrap/Table';

import { useTable } from 'react-table'

import peaks from '../data/peaks.json';
import non_peaks from '../data/non_peaks.json';

function Table({ columns, data }) {
  // Use the state and functions returned from useTable to build your UI
  const { getTableProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data,
  })

  // Render the UI for your table
  return (
    <BTable striped bordered hover size="sm" {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {rows.map((row, i) => {
          prepareRow(row)
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return (
                  <td {...cell.getCellProps()}>
                    {cell.render('Cell')}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </BTable>
  )
}

function Tables() {
  const columns = React.useMemo(
    () => [
      {
        Header: 'url',
        accessor: 'url',
      },
      {
        Header: 'count',
        accessor: 'count',
      },
      {
        Header: 'avg(responseTime)',
        accessor: 'avg(responseTime)',
      },
      {
        Header: 'median',
        accessor: 'pct(responseTime, 50)',
      },
      {
        Header: 'pct(responseTime, 95)',
        accessor: 'pct(responseTime, 95)',
      },
      {
        Header: 'pct(responseTime, 99)',
        accessor: 'pct(responseTime, 99)',
      },
      {
        Header: 'pct(responseTime, 99.5)',
        accessor: 'pct(responseTime, 995)',
      }
    ],
    []
  )

  return (
    <div>
      {peaks.map((peak) => (
        <div>
          <h3>{`Expected CPU: ${peak.cpuData.expected_CPU}, Actual: ${peak.cpuData.actual_CPU}`}</h3>
          <Table columns={columns} data={peak.data} />
        </div>
      ))}

      {non_peaks.map((peak) => (
        <div>
          <h3>{`Expected CPU: ${peak.cpuData.expected_CPU}, Actual: ${peak.cpuData.actual_CPU}`}</h3>
          <Table columns={columns} data={peak.data} />
        </div>
      ))}
    </div>
  )
}

export default Tables
