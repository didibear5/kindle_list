/*
  {
    data: [{
      {
        seriesId,
        seriesTitle,
        seriesUrl,
        newSeriesBookList: [{
          bookTitle,
          bookImage
        }]
      }
    }
  }
*/

import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request) {
  try {
    const { db } = await connectToDatabase();
    const updateData = await request.json(); // 從請求中取得更新內容

    // 處理每一筆更新資料
    const updatePromises = updateData.data.map(async (item) => {
      
      // 處理書籍列表，只在需要時更新歷史最低價
      // const updatedBookList = item.seriesBookList.map((book) => {
   
      //   // 如果當前書籍不存在歷史最低價，或新價格更低，則更新歷史最低價
      //   // if (!currentBook?.historicalLowPrice || 
      //   //     newBook.historicalLowPrice.price < currentBook.historicalLowPrice.price) {
      //   //   return newBook;
      //   // }
        
      //   if (book.historicalLowPrice) {
      //     // 保持原有的歷史最低價
      //     return {
      //       ...book,
      //       historicalLowPrice: {
      //         ...book.historicalLowPrice,
      //         updatedAt: new Date().toJSON()
      //       }
      //     };
      //   } else {
      //     return book
      //   }
      // });
      
      // 準備更新的數據
      const updateFields = {
        // seriesTitle: item.seriesTitle,
        // seriesUrl: item.seriesUrl,
        seriesCurrentPrice: item.seriesCurrentPrice,
        seriesCurrentPoint: item.seriesCurrentPoint,
        updatedAt: new Date().toJSON()
      };

      // 只有當新價格低於現有歷史最低價時才更新
      // if (!currentSeries.seriesHistoricallowPrice || 
      //   item.seriesHistoricallowPrice.price < currentSeries.seriesHistoricallowPrice.price) {
      //   updateFields.seriesHistoricallowPrice = item.seriesHistoricallowPrice;
      // }

      if (item.seriesHistoricallowPrice) {
        updateFields.seriesHistoricallowPrice = {
          ...item.seriesHistoricallowPrice,
          updatedAt: new Date().toJSON()
        }
      }

      // 建立更新操作物件
      const updateOperation = {
        $set: updateFields,
      };
      // 只有在 newSeriesBookList 存在且有內容時才添加 $push 操作
      if (item.newSeriesBookList && item.newSeriesBookList.length > 0) {
        updateOperation.$push = {
          seriesBookList: {
            $each: item.newSeriesBookList.map(book => ({
              ...book,
              _id: new ObjectId()
            }))
          }
        };
      }
      return db.collection("series").updateOne(
        { _id: new ObjectId(item.seriesId) },
        updateOperation
      );
    });

    // 等待所有更新完成
    const results = await Promise.all(updatePromises);

    // 檢查更新結果
    const failedUpdates = results.filter(result => result.matchedCount === 0).length;
    if (failedUpdates > 0) {
      return new Response(
        JSON.stringify({ 
          message: `${failedUpdates} documents were not found and not updated` 
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "All data added successfully", updatedCount: results.length  }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error adding data:", error);
    return new Response(
      JSON.stringify({ message: "Failed to add data", error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
