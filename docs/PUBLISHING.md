# 広告収益化に向けた公開手順

確認日：2026年11月6日。今回は公開先の変更、ドメインの購入、広告アカウントの作成や広告コードの設置はしていません。

## GitHubは引き続き使えます

GitHubでのソース管理と、Webサイトを配信するホスティングは別です。GitHubのリポジトリはそのまま使い、公開先だけを変更できます。

「GitHub Pagesでは広告があるだけで必ず禁止」とは断定しません。ただし、GitHub Pagesにはオンライン事業・電子商取引・商用SaaSなどの利用制限があります。広告収益化を始める前に用途との適合を確認し、必要に応じて公開先を移してください。[GitHub Pagesの利用制限](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

## 公開先の候補と設定例

このサイトは静的HTMLなので、静的サイトを配信できるサービスを選べます。ここではGitHub連携があるCloudflare Pagesを設定例にします。契約前に、利用時点の料金・無料枠・利用規約をご確認ください。無料枠に制限がないという意味ではありません。

1. Cloudflareのダッシュボードで「Workers & Pages」→「Create application」→「Pages」→既存Gitリポジトリのインポートへ進みます。
2. GitHubの連携権限を確認し、`1zuminmin/muda-ec-site` を選びます。不要なリポジトリへの権限は付ける必要がありません。
3. 次の値で設定します。`main` ブランチを新たに作る必要はありません。

| 設定項目 | このリポジトリでの値 |
| --- | --- |
| Production branch | `codex/muda-shop-initial` |
| Framework preset | None |
| Root directory | リポジトリのルート（空欄） |
| Build command | `exit 0`（ビルド不要） |
| Build output directory | `.`（index.htmlがあるルート） |

4. Deployを実行し、発行された `https://プロジェクト名.pages.dev/` を開きます。トップだけでなく `shop.html`、`earn.html`、`terms.html`、`privacy.html` も確認します。
5. 必要なら独自ドメインを購入してCustom domainsから設定し、HTTPSが有効になったことを確認します。独自ドメインには通常費用がかかります。購入先やドメイン名は本人が決めてください。
6. 公開先が決まったら `js/storage.js` の `siteURL` を新URLに変更します。READMEのサイトURL、`privacy.html` の配信サービスの説明、各所の案内も更新します。
7. 古い公開先を閉じるか、移転案内を出すかを決めます。公開先のドメインが変わるとlocalStorageの保存領域も変わり、プレイ記録は自動で移りません。移転前に利用者へ案内し、必要なら先にデータの書き出し・復元機能を作ります。

設定の根拠：[静的HTMLの公開](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)、[ビルド設定](https://developers.cloudflare.com/pages/configuration/build-configuration/)、[GitHub連携](https://developers.cloudflare.com/pages/get-started/git-integration/)、[無料枠などの制限](https://developers.cloudflare.com/pages/platform/limits/)。画面名が変わった場合は公式手順を優先してください。

## 広告を申請する前に

- 作者のボヤキを本人の文章に直し、仮原稿の案内を外します。商品説明や紹介文も、利用者にとって内容があるものに整えます。
- フッターの利用規約・プライバシー・作者のXが開けることを確認します。現在の作者Xは `@izuko_1231` です。
- ゲーム内のお金と会費が架空であることを明確に保ちます。
- PC・スマートフォンで内職、購入、所持金、名前、認定証PNG、X共有を確認します。
- 利用する広告サービスに合わせてプライバシー説明と、必要な同意・選択方法を準備します。現在の説明は広告未導入の状態を記述しており、広告導入時にそのまま使い続けないでください。

これらを用意すれば審査に通る、という保証はありません。AdSenseはサイト全体を審査します。[サイトの審査・接続](https://support.google.com/adsense/answer/7584263?hl=ja)

## AdSense導入の流れ

1. AdSenseの利用要件とポリシーを確認し、本人のアカウントで登録します。本人確認・支払情報などは本人が入力してください。
2. 広告を載せる最終的な公開URLを「サイト」に登録します。
3. 管理画面に表示された所有確認方法を使います。HTMLコード・メタタグ・ads.txtなど、選んだ方法に必要な値は本人の管理画面から取得します。架空の広告IDを公開しないでください。
4. 指定の確認用コード等を設置し、審査をリクエストします。承認されるまで広告表示は開始できません。
5. 広告のCookie、利用事業者、利用目的、広告設定へのリンクなどをプライバシー説明に反映し、対象地域・配信方式に必要な同意管理を設定します。
6. 承認後に広告枠を設定します。封筒をなぞる場所・購入ボタン・モーダル・リセット操作の近くを避け、広告であることが分かる配置にします。広告クリックを報酬や実績の条件にしません。
7. 表示崩れや誤タップの起きやすさを実機で確認します。動作確認のために自分の広告をクリックしないでください。

公式情報：[参加要件](https://support.google.com/adsense/answer/9724?hl=ja)、[サイトの所有](https://support.google.com/adsense/answer/91205?hl=ja)、[サイトの接続](https://support.google.com/adsense/answer/7584263?hl=ja)、[プライバシーに必要な内容](https://support.google.com/adsense/answer/1348695?hl=ja)、[プログラムポリシー](https://support.google.com/adsense/answer/48182?hl=ja)。
