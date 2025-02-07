/*
  {
    data: [{
      relativeId,
      priceHistory: {
        price,
        point,
      },
      historicalLowPrice: {
        price,
        point
      }
    }]
  }
*/

import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json(); // 取得請求中的 JSON 資料

    const documents = body.data.map(item => ({
      relativeId: new ObjectId(item.relativeId),
      priceHistoryList: [
        {
          ...item.priceHistory,
          createdAt: new Date().toJSON(),
        }
      ],
      historicalLowPrice: {
        ...item.historicalLowPrice,
        updatedAt: new Date().toJSON()
      }
    }));

    // 使用 insertMany 批量插入數據
    const result = await db.collection("priceHistory").insertMany(documents);

    return new Response(
      JSON.stringify({ message: "Data added successfully", data: result }),
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
