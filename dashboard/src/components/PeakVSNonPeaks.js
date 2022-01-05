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
        Header: 'optimization_potential',
        accessor: 'optimization_potential',
      },
      {
        Header: 'count',
        accessor: 'count',
      },
      {
        Header: 'median',
        accessor: 'median',
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
      {peaks.map((data_point) => (
        <div>
          <h3>{`Expected CPU: ${data_point.cpuData.expected_CPU}, Actual: ${data_point.cpuData.actual_CPU}`}</h3>
          <Table columns={columns} data={data_point.data} />
        </div>
      ))}

      {non_peaks.map((data_point) => (
        <div>
          <h3>{`Expected CPU: ${data_point.cpuData.expected_CPU}, Actual: ${data_point.cpuData.actual_CPU}`}</h3>
          <Table columns={columns} data={data_point.data} />
        </div>
      ))}
    </div>
  )
}

export default Tables
