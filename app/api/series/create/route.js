/*
  {
    seriesTitle,
    seriesUrl,
    seriesBookList: [
      {
        bookTitle,
        bookImage
      }
    ]
  }
*/

import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json(); // 取得請求中的 JSON 資料

    // 新增資料到 MongoDB 的集合
    const result = await db.collection("series").insertOne({
      ...body,
      seriesBookList: body.seriesBookList.map(item => {
        return {
          ...item,
          _id: new ObjectId()
        }
      }),
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
    });

    // 查詢剛才插入的文檔
    const insertedDoc = await db.collection("series").findOne({
      _id: result.insertedId
    });

    return new Response(
      JSON.stringify({ 
        message: "Data added successfully", 
        insertedId: result.insertedId,
        data: insertedDoc  // 返回完整的插入文檔
      }),
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
