/*
  {
    data: [{
      relativeId,
      newPrice: {
        price,
        point,
      },
      historicalLowPrice: {
        price,
        point,
      }
    }
  }
*/

import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request) {
  try {
    const { db } = await connectToDatabase();
    // const { id } = params; // 從 URL 參數中取得 id
    const updateData = await request.json(); // 從請求中取得更新內容

    // 確保傳入的 `id` 是有效的 MongoDB ObjectId
    // if (!ObjectId.isValid(id)) {
    //   return new Response(JSON.stringify({ message: "Invalid ID format" }), {
    //     status: 400,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }
    
   // 處理每一筆更新資料
    const updatePromises = updateData.data.map(async (item) => {
      const updateFields = {};

      if (item.historicalLowPrice) {
        updateFields.historicalLowPrice = {
          ...item.historicalLowPrice,
          updatedAt: new Date().toJSON()
        }
      }

      return db.collection("priceHistory").updateOne(
        { relativeId: new ObjectId(item.relativeId) },
        {
          $set: updateFields,
          $push: {
            priceHistoryList: {
              price: item.newPrice.price,
              point: item.newPrice.point,
              createdAt: new Date().toJSON(),
            },
          },
        }
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
