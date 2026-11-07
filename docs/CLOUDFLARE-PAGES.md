# 伊見内商会：GitHubのユーザー名が入らないURLで公開する手順

確認日：2026年11月7日

公開URLを `https://iminai-shokai.pages.dev/` のような形にする手順です。名前は空き状況によります。`pages.dev` の無料サブドメインを使うため、独自ドメインの購入は不要です。GitHubはこれまでどおりコードの保存に使います。

2026年11月7日にユーザーが https://iminai-shokai.pages.dev/ で公開し、HTTP 200とサイトのタイトルを確認しました。X共有URL・README・配信サービスの説明も新URLに合わせて更新しています。旧GitHub Pagesの停止はこの作業では実行していません。以下は設定の再確認・再作成用の手順です。

## 1. Cloudflareに登録する

1. [Cloudflareのダッシュボード](https://dash.cloudflare.com/)を開きます。
2. アカウントを作成し、メール認証とログインを済ませます。
3. この方法ではドメイン購入や、有料プランの契約は不要です。ドメインの追加画面ではなく、次の「Workers & Pages」へ進んでください。

## 2. PagesにGitHubを連携する

1. メニューから **Workers & Pages**（WorkersとPages）を開きます。
2. **Create application**（アプリケーションを作成）を選びます。
3. **Pages** を選び、**Connect to Git** または **Import an existing Git repository** へ進みます。
4. GitHubを選んでログインし、連携を許可します。リポジトリを選択できる画面では **Only select repositories** を選び、`muda-ec-site` だけを指定すれば十分です。
5. `1zuminmin/muda-ec-site` を選び、**Begin setup**（セットアップを開始）へ進みます。

Workers用の実行コードやデプロイコマンドを要求される場合は、Pagesの設定に入れているか確認してください。日本語訳や画面配置が異なる場合があります。[公式のGit連携手順](https://developers.cloudflare.com/pages/get-started/git-integration/)

## 3. このサイトの設定を入力する

| 項目 | 入力する値 |
| --- | --- |
| Project name／プロジェクト名 | `iminai-shokai`（使用済みなら別の名前） |
| Production branch／本番ブランチ | `codex/muda-shop-initial` |
| Framework preset／フレームワーク | `None` |
| Build command／ビルドコマンド | `exit 0` |
| Build output directory／ビルド出力先 | `.`（半角のピリオド1文字） |
| Root directory／ルートディレクトリ | 空欄のまま |
| Environment variables／環境変数 | 追加不要 |

`main` ブランチを作る必要はありません。このサイトの `index.html` はリポジトリ直下にあるので、出力先は `.` です。APIキーやNode.jsの設定も不要です。[静的HTMLの公式設定例](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)

**Save and Deploy**（保存してデプロイ）を押し、成功すると表示されるURLを開きます。

プロジェクト名が使えた場合の例：`https://iminai-shokai.pages.dev/`

## 4. 公開されたサイトを確認する

スマートフォンからも新URLを開いて、次を確認します。

- トップの商品画像と商品詳細が表示される。
- 資金づくりで報酬が入り、再読み込み後も所持金が残る。
- 架空購入、実績、名前の設定が使える。
- 認定証の画像ページが開く。
- 利用規約・プライバシー・作者のXが開く。

ローカル確認用の `.qa/` プレビューはGitHubへ保存していないため、公開先には含まれません。公開サイトでは通常の0円スタートです。

## 5. 新URLに合わせてサイトを仕上げる

Cloudflareで発行された**実際のURL**をCodexに伝えてください。次を更新して、GitHubに反映します。

- `js/storage.js` の `siteURL`：X共有に付けるURL。
- `README.md` のサイトURL。
- `privacy.html` の配信サービスの説明と公式プライバシー情報へのリンク。
- URLに依存するテストと、移転案内が必要な箇所。

ここが未更新だと、新サイトからXで共有しても旧GitHub PagesのURLが入ります。発行される前の仮URLには変更しません。

公開先のドメインが変わるとlocalStorageの保存領域も変わります。**旧サイトの所持金・実績・名前・周回記録は自動で移りません。** 現在は記録を移す書き出し・復元機能がありません。旧記録を残したい方は旧サイトを利用するか、先に移行機能を追加する必要があります。

## 6. 新URLを配布する

URLを仕上げて動作確認したら、新しい `pages.dev` のURLを友人やSNSに共有します。

以後は `codex/muda-shop-initial` にpushされると、Cloudflareが自動で公開内容を更新します。Cloudflare側のDeploymentsで成功したか確認できます。[自動デプロイの説明](https://developers.cloudflare.com/pages/get-started/git-integration/)

旧GitHub Pagesは自動では止まりません。一時停止なら、新サイト確認後にGitHubリポジトリの **Settings → Pages** で公開URL横のメニューから **Unpublish site** を選べます。ただし、その後のデプロイで再公開されます。継続して停止したい場合は、**Build and deployment → Source: Deploy from a branch → Branch: None → Save** を選びます。これは旧サイトの公開を止める操作なので、移行が終わってから判断してください。[GitHub公式の停止方法](https://docs.github.com/en/pages/getting-started-with-github-pages/deleting-a-github-pages-site)

新URLにはGitHubのユーザー名は入りません。ただし、公開リポジトリやGitの履歴からアカウント情報を確認できる点は変わりません。

## うまくいかないとき

| 症状 | 確認する場所 |
| --- | --- |
| ドメイン購入を求められる | 独自ドメイン設定ではなくPagesのGit連携へ進む |
| Workersのコード入力やデプロイコマンドを求められる | Pagesの設定へ戻る |
| プロジェクト名を使えない | GitHub名を含めず、`iminai-shop` など別の空いている名前にする |
| 公開URLで404になる | 本番ブランチ、出力先 `.`、リポジトリ直下の `index.html` を確認 |
| 更新が反映されない | 本番ブランチと最新デプロイの成功を確認 |
| X共有でGitHubのURLになる | 上記「5」の `siteURL` を更新する |

無料枠には月500ビルド、1ファイル25MiBなどの制限があります。現在の商品画像は最大約3MBです。利用時点の[公式の上限](https://developers.cloudflare.com/pages/platform/limits/)も確認してください。

広告を導入するときの手順は [PUBLISHING.md](PUBLISHING.md) を参照してください。
