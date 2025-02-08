"use client"
import { useEffect, useState } from "react";
import { DOMAIN } from '../constants'
import { last } from 'lodash-es'
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Home() {
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState({});

  useEffect(() => {
    async function fetchData() {
      const seriesDataResponse = await fetch(`${DOMAIN}/api/series/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const seriesDataResult = await seriesDataResponse.json();
      setSeriesList(seriesDataResult?.result?.seriesList)
      setSelectedSeries(seriesDataResult?.result?.seriesList[0])
    }
    fetchData();
  }, [])

  const onSeriesClick = (series) => {
    setSelectedSeries(series)
  }

  return (
    <div>
      <main>
        <div>
          {
            seriesList.length === 0 ? <div>waiting....</div> : ''
          }
          <ul>
            {
              seriesList.map(seriesListItem => {
                return(
                  <li key={seriesListItem._id}
                    style={{"color": seriesListItem.seriesTitle === selectedSeries.seriesTitle ? '#cd3b3b': ''}}
                  >
                    <span onClick={() => onSeriesClick(seriesListItem)} style={{'cursor': 'pointer'}}>{seriesListItem.seriesTitle}</span>
                  </li>
                )
              })
            }
          </ul>
          <hr/ >
          <table>
              <thead>
                <tr>
                  <th>書名</th>
                  <th>封面</th>
                  <th>最近五筆價格</th>
                  <th>今日價格</th>
                  <th>歷史低價</th>
                </tr>
              </thead>
              <tbody>
                {
                  selectedSeries?.seriesBookList?.map(seriesBookListItem => {
                    return(
                      <tr key={seriesBookListItem._id} style={{"background": seriesBookListItem.priceHistoryList.length > 1 && last(seriesBookListItem.priceHistoryList).price - last(seriesBookListItem.priceHistoryList).point <= seriesBookListItem?.historicalLowPrice?.price - seriesBookListItem?.historicalLowPrice?.point ? '#ffc174': ''}}>
                        <td style={{'width': '150px'}}>{seriesBookListItem.bookTitle}</td>
                        <td style={{'width': '100px'}}>
                          <img style={{'width': '100%'}} src={seriesBookListItem.bookImage}/>
                        </td>
                        <td style={{'width': '400px'}}>
                          <Line data={{
                            labels: seriesBookListItem.priceHistoryList.map(item => new Date(item.createdAt).toISOString().split('T')[0]),
                            datasets: [
                              {
                                label: 'Price',
                                data: seriesBookListItem.priceHistoryList.map(item => item.price),
                                borderColor: '#4280b5',
                                borderWidth: 2,
                                backgroundColor: '#4280b5',
                                fill: false,
                              },
                              {
                                label: 'Point',
                                data: seriesBookListItem.priceHistoryList.map(item => item.point),
                                borderColor: '#aab9c5',
                                borderWidth: 2,
                                backgroundColor: '#aab9c5',
                                fill: false,
                              },
                              {
                                label: 'Final price',
                                data: seriesBookListItem.priceHistoryList.map(item => item.price - item.point),
                                borderColor: '#b54242',
                                borderWidth: 2,
                                backgroundColor: '#b54242',
                                fill: false
                              },
                            ]
                          }}/>
                        </td>
                        <td>
                          price: {last(seriesBookListItem.priceHistoryList).price}<br/>
                          point: {last(seriesBookListItem.priceHistoryList).point}<br/>
                          final price: {last(seriesBookListItem.priceHistoryList).price - last(seriesBookListItem.priceHistoryList).point}<br/><br/>
                        </td>
                        <td>
                          price: {seriesBookListItem?.historicalLowPrice?.price}<br/>
                          point: {seriesBookListItem?.historicalLowPrice?.point}<br/>
                          final price: {seriesBookListItem?.historicalLowPrice?.price - seriesBookListItem?.historicalLowPrice?.point}<br/>
                          date: {new Date(seriesBookListItem?.historicalLowPrice?.updatedAt).toISOString().split('T')[0]}
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
          </table>
          
        </div>
      </main>
    </div>
  );
}
