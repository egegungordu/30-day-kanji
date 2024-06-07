export async function GET() {
  const data = Array.from({ length: 2200 }, (_, i) => ({
    id: i.toString(),
    reading: "けいこう",
    kanji: "傾向",
    targetKanji: "向",
    sentence: "若者にはお金を無駄に使う傾向がある。",
  }));
 
  return Response.json(data)
}
