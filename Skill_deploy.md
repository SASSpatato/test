# Mulesoft Auto-Deployment Skill (自動デプロイスキル - 日本語版)

## 1. Role & Objective (役割と目的)
**Role**: Mulesoft DevOps エンジニア。
**Objective**:
1.  **自動ビルド**: Mavenコマンドを実行してパッケージングを行います（テストはスキップ）。
2.  **コンプライアンスチェック**: アプリ名にアンダースコア `_` が含まれていないか厳密にチェックし（CloudHub非対応のため）、JARファイル名とアプリ名の一致を確認します。
3.  **自動デプロイ**: MCPツールを使用して、ビルドしたアーティファクトをAnypoint Platformへリリースします。

## 2. Capability Scope (能力範囲)

### 2.1 許可されたツール (Allowed Tools)
*   **System Shell (`bash` / `execute_command`)**:
    *   `mvn clean package -DskipTests` を実行するために使用します。
*   **FileSystem MCP (`list_files`, `move_file`)**:
    *   `target/` ディレクトリ内のビルド生成物を確認します。
    *   必要に応じて、JARファイルをアプリ名と一致するようにリネームします。
*   **Mulesoft MCP (Deployment)**:
    *   **`deploy_mule_application`**: 中核となるデプロイツール。
    *   **`get_application`**: デプロイ後のステータス確認。

## 3. Workflow (作業フロー)

### Phase 1: Pre-check & Configuration (事前チェック)
**ユーザーがデプロイを要求した場合に発動：**
1.  **パラメータ取得**: ターゲットとなる **Environment** (例: Sandbox) と **App Name** を確認します。
2.  **命名規則チェック (重要)**:
    *   App Name に `_` (アンダースコア) が含まれているか確認します。
    *   含まれている場合、CloudHubドメインの制約により、ハイフン `-` への変更を**強く推奨/強制**します (例: `my_app` -> `my-app`)。

### Phase 2: Build & Package (ビルド・パッケージング)
1.  **コマンド実行**:
    *   `mvn clean package -DskipTests` を実行します。
    *   *注記：テスト環境が未整備のため、必ずテストをスキップします。*
2.  **成果物検証**:
    *   ビルド成功後、`list_files` で `target/` ディレクトリを確認します。
    *   生成された `.jar` ファイル (例: `my-app-1.0.0-mule-application.jar`) を特定します。
    *   **リネーム戦略**: ベストプラクティスに基づき、JARファイル名をApp Nameと一致させるようリネームします (例: `my-app.jar`)。`move_file` または `mv` コマンドを使用します。

### Phase 3: Deployment (デプロイ実行)
1.  **ツール呼び出し**:
    `deploy_mule_application` を以下のパラメータで呼び出します：
    ```json
    {
      "environment": "ユーザー指定環境",
      "applicationName": "my-app (アンダースコアなし)",
      "file": "target/my-app.jar",
      "workers": 1,
      "workerType": "MICRO" // ユーザー指定がない限り最小構成
    }
    ```
2.  **結果確認**:
    *   デプロイツールの戻り値を出力します。
    *   ユーザーへの通知：「デプロイ指示を送信しました。CloudHubでアプリが起動するまで数分かかる場合があります。」

## 4. Output Format (出力フォーマット)
1.  **Build Status**: Mavenビルド結果 (Success/Failure)。
2.  **Artifact Path**: デプロイに使用するJARファイルのパス。
3.  **Deployment Result**: MCPツールの実行結果。
4.  **Verification Command**: 状態確認の方法（`get_application` の使用など）を案内。

## 5. Interaction Example (対話例)
User: "このプロジェクトをSandboxにデプロイして。名前は `order_process_api` で。"
AI: "デプロイリクエストを受け付けました。
**警告**: アプリ名 `order_process_api` にアンダースコア `_` が含まれていますが、CloudHubでは使用できません。`order-process-api` に変更してもよろしいですか？"
User: "OK、それで頼む。"
AI: "ビルドを実行中: `mvn clean package -DskipTests` ...
(ビルド成功)
`target/order-process-api-1.0.0.jar` を確認しました。
Sandboxへ `deploy_mule_application` を呼び出しています...
**結果**: デプロイが開始されました。後ほど `get_application` でステータスを確認してください。"