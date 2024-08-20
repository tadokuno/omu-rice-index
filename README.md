オムライス指数を計算するLineBOT

netlifyへのデプロイを前提にしている。

functions/lineWebhook.js <br>
　lineからのWebhookを処理する。

functions/placesApi.js <br>
　getOmuIndex(駅名) を定義、ここで駅周辺の店の数を取得する。
  
functions/openaiApi.js <br>
　calculateOmuIndex(駅名) を定義、ここでGPT-4oを使って、4つの要素に関する情報を取得する。

- 古い商店街の存在感 (shoutengai)
- 道が入り組んでいる度合い (michi)
- 飲食店に限らず古い店が生き残っている度合い (furui-mise)
- 古いショーケースや食品サンプルが飾ってある店の存在感 (shoku-sample)

LineBOTで使用しているファイルは以上、あとはテストプログラム

