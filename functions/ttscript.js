import { omuIndexMain,createLineMesasge } from './script.js';
import { readFile } from 'fs/promises';

// コマンドライン引数から駅名を取得

console.log("omuIndexMain Start")
const stationName = process.argv[2];

if (!stationName) {
    console.error('駅名を指定してください。');
    process.exit(1);
}

// メイン処理
(async () => {
  try {
    const result = await omuIndexMain(stationName); // 戻り値はJSON形式のデータ
    console.log(createLineMesasge(stationName,result.googlemap,result.openai,result.index));
  } catch (error) {
      console.error('Error at Main:', error);
  } finally {
    process.stdin.setRawMode(false);  // stdinのrawモードを解除
    process.stdin.pause();  // stdinを閉じる
  }
})();


// 非同期にJSONファイルを読み込む関数
async function loadJSONFile(filePath) {
  try {
      // ファイルを読み込み
      const data = await readFile(filePath, 'utf8');
      console.log(data);
      
      // JSONデータをパース
      const jsonData = JSON.parse(data);
      
      // データをコンソールに表示（または他の操作）
      console.log(jsonData);
      
      // 必要に応じて戻り値として返す
      return jsonData;
  } catch (err) {
      console.error('エラーが発生しました: ', err);
  }
}

// JSONファイルを読み込む関数
async function loadJSONFileURL(filePath) {
  try {
      // fetch APIを使用してJSONファイルを取得
      const response = await fetch(filePath);
      
      // レスポンスがOKでない場合、エラーをスロー
      if (!response.ok) {
          throw new Error(`HTTPエラー: ${response.status}`);
      }

      // JSONデータを取得してパース
      const jsonData = await response.json();
      
      // JSONデータをコンソールに表示（または他の操作）
      console.log(jsonData);
      
      // 必要に応じて戻り値として返す
      return jsonData;
  } catch (error) {
      console.error('エラーが発生しました: ', error);
  }
}
