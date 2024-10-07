import { getOmuIndexCountable } from './placesApi.js';
import { calculateOmuIndex } from './openaiApi.js';
import { omuIndexMain } from './script.js';

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
    const result = await omuIndexMain(stationName); // 戻り値は表示する文字列
    console.log(result);
  } catch (error) {
      console.error('Error fetching Omu Index:', error);
  } finally {
    process.stdin.setRawMode(false);  // stdinのrawモードを解除
    process.stdin.pause();  // stdinを閉じる
  }
})();
