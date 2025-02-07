/*
  {
    newSeriesBookList: [{
      bookTitle,
      bookImage
    }]
  }
*/

import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const { id } = await params;
    const updateData = await request.json(); // 從請求中取得更新內容
    const { newSeriesBookList } = updateData; // 從更新資料中取出陣列

    const booksWithTimestamp = newSeriesBookList.map(book => ({
      ...book,
      _id: new ObjectId(),
    }));

    // 更新資料
    const result = await db.collection("series").updateOne(
      { _id: new ObjectId(id) }, // 條件：依據 _id
      {
        $push: {
          seriesBookList: {
            $each: booksWithTimestamp  // 使用 $each 運算符來插入多筆資料
          }
        }
      }
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

    const series = await db
    .collection("series")
    .findOne({ _id: new ObjectId(id) });
  
    return new Response(
      JSON.stringify({ message: "All data added successfully", result: { series } }),
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
