import connectToDatabase from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    console.log("Database connected successfully");

    const seriesList = await db
      .collection("series")
      .aggregate([
        // 展開 seriesBookList，讓每本書成為獨立文件
        { $unwind: "$seriesBookList" },
        // 與 priceHistory 進行關聯
        {
          $lookup: {
            from: "priceHistory", // 關聯集合名稱
            localField: "seriesBookList._id", // 書籍標識符
            foreignField: "relativeId", // 對應 priceHistory 的書籍標識符
            as: "priceHistoryData", // 關聯結果存放欄位
          },
        },
        {
          $lookup: {
            from: "priceHistory",
            localField: "_id",
            foreignField: "relativeId",
            as: "seriesPriceHistory",
          },
        },
        {
          $addFields: {
            "seriesBookList.priceHistoryList": {
              $slice: [
                {
                  $ifNull: [
                    { $first: "$priceHistoryData.priceHistoryList" },
                    [],
                  ],
                },
                -5, // 負數表示從尾部開始取
              ],
            },
            "seriesBookList.historicalLowPrice":  { $first: "$priceHistoryData.historicalLowPrice" },
            "historicalLowPrice": { $first: "$seriesPriceHistory.historicalLowPrice" },
            "priceHistoryList": {
              $slice: [
                { $ifNull: [{ $first: "$seriesPriceHistory.priceHistoryList" }, []] },
                -5,
              ],
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            seriesTitle: { $first: "$seriesTitle" },
            seriesUrl: { $first: "$seriesUrl" },
            historicalLowPrice: { $first: "$historicalLowPrice" },
            priceHistoryList: { $first: "$priceHistoryList" },
            seriesBookList: {
              $push: {
                _id: "$seriesBookList._id",
                bookTitle: "$seriesBookList.bookTitle",
                bookImage: "$seriesBookList.bookImage",
                historicalLowPrice: "$seriesBookList.historicalLowPrice",
                priceHistoryList: "$seriesBookList.priceHistoryList",
              },
            },
          },
        },
        {
          $sort: {
            seriesUrl: 1,
          },
        },
      ])
      .toArray();

    return new Response(
      JSON.stringify({ message: "成功取得系列書籍列表", result: { seriesList }}),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
          "Expires": new Date(Date.now() + 86400000).toUTCString()
        },
      },
    );
  } catch (error) {
    console.error("取得系列書籍列表失敗：", error);
    return new Response(
      JSON.stringify({
        message: "取得系列書籍列表失敗",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
