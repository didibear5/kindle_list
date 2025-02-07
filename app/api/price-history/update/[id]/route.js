import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params; // 從 URL 參數中取得 id
    const updateData = await request.json(); // 從請求中取得更新內容

    // 確保傳入的 `id` 是有效的 MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ message: "Invalid ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 更新資料
    const result = await db.collection("priceHistory").updateOne(
      { relativeId: new ObjectId(id) }, // 條件：依據 _id
      {
        $push: {
          priceHistoryList: {
            ...updateData,
            createdAt: new Date().toJSON(),
          },
        },
      }, // 使用 $push 將新數據添加到 prices 陣列中
    );

    // 檢查是否有資料被修改
    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ message: "No matching document found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

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
