import connectToDatabase from "@/lib/mongodb";

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json(); // 取得請求中的 JSON 資料

     // 新增資料到 MongoDB 的集合
     const result = await db.collection("log").insertOne({
      ...body,
      createdAt: new Date().toJSON()
    });


    return new Response(
      JSON.stringify({ message: "成功新增log", data: result }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error adding data:", error);
    return new Response(
      JSON.stringify({ message: "新增log失敗", error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
