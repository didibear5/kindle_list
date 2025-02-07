import puppeteer from 'puppeteer';
import { isEmpty, last } from 'lodash-es'
import { DOMAIN } from '../../../constants'

async function getSeriesList() {
  const seriesDataResponse = await fetch(`${DOMAIN}/api/series/list`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!seriesDataResponse.ok) {
    throw new Error(`HTTP error! status: ${seriesDataResponse.status}`);
  }

  const seriesDataResult = await seriesDataResponse.json();
  return seriesDataResult.result.seriesList;
}

function isLower(oldPrice, newPrice) {
  return oldPrice.price - oldPrice.point > newPrice.price - newPrice.point
}

function isDiff(oldPrice, newPrice) {
  return oldPrice.price !== newPrice.price || oldPrice.point !== newPrice.point
}

async function createSeries(seriesData, seriesPrice, _seriesBookList) {
  const seriesDataResponse = await fetch(`${DOMAIN}/api/series/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(seriesData)
  });

  if (!seriesDataResponse.ok) {
    throw new Error(`HTTP error! status: ${seriesDataResponse.status}`);
  }

  const seriesDataResult = await seriesDataResponse.json();

  const priceHistoryData = seriesDataResult.data.seriesBookList.map((book, i) => { // 系列的個別價格
    return {
      relativeId: book._id,
      priceHistory: {
        price: _seriesBookList[i].price,
        point: _seriesBookList[i].point,
      },
      historicalLowPrice: {
        price: _seriesBookList[i].price,
        point: _seriesBookList[i].point,
      }
    }
  })
  priceHistoryData.push({ // 系列全套的價格
    relativeId: seriesDataResult.data._id,
    priceHistory: {
      price: seriesPrice.price,
      point: seriesPrice.point,
    },
    historicalLowPrice: {
      price: seriesPrice.price,
      point: seriesPrice.point,
    }
  })
   const priceHistoryResponse = await fetch(`/api/price-history/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: priceHistoryData })
  });

  if (!priceHistoryResponse.ok) {
    throw new Error(`HTTP error! status: ${priceHistoryResponse.status}`);
  }
  console.log('新增系列資料成功');
}

async function updateSeries(existingSeries, seriesPrice, seriesBookList, _seriesBookList) {
  if (existingSeries.seriesBookList.length !== seriesBookList.length) {
      // 找出新增的書籍
      // const newBooks = seriesBookList.filter((newBook, index) => {
      //   return !existingSeries.seriesBookList.some(existingBook => 
      //     existingBook.bookTitle === newBook.bookTitle
      //   );
      // });
      // 假設新增的都是接在後面
      const newBooks = seriesBookList.slice(existingSeries.seriesBookList.length)
      const _newBooks = _seriesBookList.slice(existingSeries.seriesBookList.length)
      const seriesDataResponse = await fetch(`${DOMAIN}/api/series/update/${existingSeries._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newSeriesBookList: newBooks })
      });
    
      if (!seriesDataResponse.ok) {
        throw new Error(`HTTP error! status: ${seriesDataResponse.status}`);
      }
    
      const seriesDataResult = await seriesDataResponse.json();
      // series = seriesDataResult.result.series;

      const { series } = seriesDataResult.result;
      const priceHistoryData = series.seriesBookList.slice(existingSeries?.seriesBookList?.length).map((book, i) => {
        return {
          relativeId: book._id,
          priceHistory: {
            price: _newBooks[i].price,
            point: _newBooks[i].point,
          },
          historicalLowPrice: {
            price: _newBooks[i].price,
            point: _newBooks[i].point,
          }
        }
      })
      const priceHistoryResponse = await fetch(`${DOMAIN}/api/price-history/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: priceHistoryData })
      });
    
      if (!priceHistoryResponse.ok) {
        throw new Error(`HTTP error! status: ${priceHistoryResponse.status}`);
      }
      console.log('新增系列資料成功');
  }

  const updateData = [];
  for(let i = 0; i < existingSeries.seriesBookList.length; i++) {
    const data = {};
    if (isLower(existingSeries.seriesBookList[i].historicalLowPrice, _seriesBookList[i])) {
      data.historicalLowPrice = {
        ..._seriesBookList[i]
      }
    }
    if (isDiff(last(existingSeries.seriesBookList[i].priceHistoryList), _seriesBookList[i])) {
      data.newPrice = {
        ..._seriesBookList[i]
      }
    }
    if (!isEmpty(data)) {
      data.relativeId = existingSeries.seriesBookList[i]._id;
      updateData.push(data)
    }
  }
  const data = {};
  if (isLower(existingSeries.historicalLowPrice, seriesPrice)) {
    data.historicalLowPrice = {
      ...seriesPrice
    }
  }
  if (isDiff(last(existingSeries.priceHistoryList), seriesPrice)) {
    data.newPrice = {
      ...seriesPrice
    }
  }
  if (!isEmpty(data)) {
    data.relativeId = existingSeries._id;
    updateData.push(data)
  }

  const priceHistoryResponse = await fetch(`${DOMAIN}/api/price-history/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: updateData })
  });

  if (!priceHistoryResponse.ok) {
    throw new Error(`HTTP error! status: ${priceHistoryResponse.status}`);
  }
  console.log('更新系列資料成功');

}

export async function GET(request) {
  try {
    const productUrls = [
      'https://www.amazon.co.jp/dp/B074C559L8', // 迷宮飯
      'https://www.amazon.co.jp/dp/B08DD7GH33', // 寶石之國
      'https://www.amazon.co.jp/dp/B09BQLMCYD', // 來自深淵
      'https://www.amazon.co.jp/dp/B07KJDMKW5', // 異獸魔都
      'https://www.amazon.co.jp/dp/B096Y1KQGT', // 進擊的巨人
      'https://www.amazon.co.jp/dp/B097PWSK4P', // 影宅
    ];
    const errUrl = [];

    const seriesList = await getSeriesList();

    const browser = await puppeteer.launch();

    for (const url of productUrls) {
      const page = await browser.newPage();
      await page.goto(url);

      try {
        const seriesTitle = await page.$eval('#collection-masthead__title', el => el.textContent.trim());
        const seriesPrice = await page.$eval('#hulk_buy_price_COMPLETE_SERIES_VOLUME_volume_3', 
          el => parseInt(el.textContent.trim().replace(/[^0-9]/g, ''), 10));
        const seriesPoint = await page.$eval(
          '#hulk_buy_points_COMPLETE_SERIES_VOLUME_volume_3 span.a-text-bold', 
          el => parseInt(el.textContent.trim().replace(/[^0-9]/g, ''), 10)
        );

        const seriesTotalNumber = await page.$eval('#hulk_buy_bundle_button_COMPLETE_SERIES_VOLUME_volume_3-announce div span', 
          el => parseInt(el.textContent.trim().replace(/[^0-9]/g, ''), 10));
     
        if (seriesTotalNumber > 10) {
          await page.type('#seriesAsinListGoToId', seriesTotalNumber.toString());
          await page.keyboard.press('Enter');
          // await page.locator('li ::-p-text(すべてを表示)').click();
          await new Promise(resolve => setTimeout(resolve, 4000));
        }

        const items = await page.$$('.series-childAsin-item');

        const seriesBookList = []; // 存書籍名稱圖
        const _seriesBookList = []; // 存書籍價格點數
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            try {
                // 提取商品標題
                const bookTitle = await item.$eval(`#itemBookTitle_${i + 1}`, el => el.textContent.trim());
                const bookImage = await item.$eval(`#series-childAsin-item_${i + 1} img`, el => el.src);
                const price = await item.$eval('.a-color-price', 
                  el => parseInt(el.textContent.trim().replace(/[^0-9]/g, ''), 10));
                const point = await item.$eval('.itemPoints', 
                  el => parseInt(el.textContent.trim().replace(/[^0-9]/g, ''), 10));

                seriesBookList.push({
                  bookTitle,
                  bookImage
                });
                _seriesBookList.push({
                  price,
                  point
                });
            } catch (error) {
                console.log('跳過項目：無法獲取標題或價格', error);
            }
        }

        await page.close(); // 關閉當前頁面

        // 檢查是否有建立過系列的資料
        if (!seriesList.some(series => series.seriesUrl === url)) {
          createSeries(
            {
              seriesTitle,
              seriesUrl: url,
              seriesBookList
            }, {
              price: seriesPrice,
              point: seriesPoint
            },
            _seriesBookList
          );
        } else {
          const existingSeries = seriesList.find(series => series.seriesUrl === url);
          // seriesBookList.push({
          //   bookTitle: 'test222',
          //   bookImage: 'url',
          // }),
          // _seriesBookList.push({
          //   price: 3333,
          //   point: 3333,
          // }),
          updateSeries(
            existingSeries,
            {
              price: seriesPrice,
              point: seriesPoint
            },
            seriesBookList,
            _seriesBookList
          )
        }

      } catch (error) {
        console.error(`處理 URL ${url} 時發生錯誤:`, error);
        errUrl.push(url)
        await page.close();
        continue; // 繼續處理下一個 URL
      }
    }
    await browser.close();

    return new Response(
      JSON.stringify({ message: "成功執行每日任務", errUrl }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("每日任務執行錯誤", error);
    return new Response(
      JSON.stringify({
        message: "每日任務執行錯誤",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
