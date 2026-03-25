/**
 * 💡 IssueCommentsコンポーネントのテスト
 *
 * テスト対象:
 * - IssueComments
 * - CommentItem (内部コンポーネント)
 * 
 * 制約:
 * - any型は一切使用しない(TypeScriptの厳格な型推論を利用)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { IssueComments } from './IssueComments'; // ※実際のパスに合わせて調整
import { ReviewComment } from '@/types/domain'; // ※実際のパスに合わせて調整

// ---------------------------------------------------------
// 🛠 モック(Mock)の設定（※anyを使わず厳格に型定義）
// ---------------------------------------------------------

// 1. react-markdown のモック化 (複雑なAST解析をスキップ)
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-markdown">{children}</div>;
  };
});

// 2. remark-gfm のモック化
jest.mock('remark-gfm', () => {
  return function mockRemarkGfm() {
    return [];
  };
});

// ---------------------------------------------------------
// 🛠 テストデータの準備（Factory）
// ---------------------------------------------------------
const baseProps = {
  owner: 'test-owner',
  repo: 'test-repo',
  issueNumber: 1,
};

// ReviewComment型のダミーデータを生成するヘルパー関数
const createMockComment = (id: string, login: string, body: string, avatarUrl: string | null = 'https://example.com/avatar.png'): ReviewComment => ({
  id,
  body,
  createdAt: '2023-10-01T12:00:00Z',
  updatedAt: '2023-10-01T12:00:00Z',
  htmlUrl: `https://github.com/test/test/issues/1#issuecomment-${id}`,
  user: {
    login,
    avatarUrl,
    url: `https://github.com/${login}`,
  },
  // ※プロジェクトの実際のReviewComment型定義に合わせて不足プロパティがあれば追加してください
});

describe('IssueComments コンポーネント', () => {
  
  // fetchのモックを厳格に型付け
  let fetchMock: jest.MockedFunction<typeof global.fetch>;
  let alertMock: jest.SpyInstance<void, [message?: string]>;

  beforeEach(() => {
    // グローバルのfetchをモック関数で上書き
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    // window.alertのモック化（テスト中に実際のダイアログが出ないようにする）
    alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // fetchの成功時のレスポンスを生成するヘルパー関数
  const mockFetchResponseOk = <T,>(data: T) => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => data,
    } as Response);
  };

  // fetchの失敗時のレスポンスを生成するヘルパー関数
  const mockFetchResponseError = (errorMessage: string) => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    } as Response);
  };

  // =========================================================
  // 1. 初期描画とデータ取得のテスト
  // =========================================================
  describe('初期ロードとコメント一覧の表示', () => {
    it('初期ロード時にローディングスピナーが表示されること', () => {
      // Promiseが解決しない状態を作って、ローディング表示を確認する
      fetchMock.mockReturnValueOnce(new Promise(() => {}));
      
      render(<IssueComments {...baseProps} />);
      
      expect(screen.getByText('コメントを読み込み中...')).toBeInTheDocument();
    });

    it('コメントが0件の場合、「まだコメントがありません」と表示されること', async () => {
      // 空の配列を返すようにモック
      mockFetchResponseOk<ReviewComment[]>([]);
      
      render(<IssueComments {...baseProps} />);
      
      // ローディングが終わり、メッセージが表示されるのを待つ
      expect(await screen.findByText('まだコメントがありません')).toBeInTheDocument();
    });

    it('コメント取得に成功した場合、コメント一覧がレンダリングされること', async () => {
      const mockData = [
        createMockComment('101', 'userA', 'Hello World!'),
        createMockComment('102', 'userB', 'Looks good.'),
      ];
      mockFetchResponseOk<ReviewComment[]>(mockData);
      
      render(<IssueComments {...baseProps} />);
      
      // 非同期でデータが描画されるのを待機
      const commentCountHeader = await screen.findByText('コメント (2)');
      expect(commentCountHeader).toBeInTheDocument();

      // 各ユーザー名と本文が表示されているか確認
      expect(screen.getByText('userA')).toBeInTheDocument();
      expect(screen.getByText('userB')).toBeInTheDocument();
      expect(screen.getByText('Hello World!')).toBeInTheDocument();
    });

    it('APIエラー時にエラーメッセージが表示されること', async () => {
      mockFetchResponseError('権限がありません');
      
      render(<IssueComments {...baseProps} />);
      
      expect(await screen.findByText('権限がありません')).toBeInTheDocument();
    });
  });

  // =========================================================
  // 2. 内部コンポーネント (CommentItem) のアバター表示ロジック
  // =========================================================
  describe('CommentItemのアバター表示制御', () => {
    it('avatarUrlが存在する場合、imgタグがレンダリングされること', async () => {
      // アバターURLありのデータを返す
      mockFetchResponseOk<ReviewComment[]>([
        createMockComment('1', 'has-avatar', 'Text', 'https://example.com/img.png')
      ]);
      
      render(<IssueComments {...baseProps} />);
      
      // 画像が読み込まれるのを待つ
      const imgElement = await screen.findByAltText('has-avatar');
      expect(imgElement).toBeInTheDocument();
      expect(imgElement).toHaveAttribute('src', 'https://example.com/img.png');
    });

    it('avatarUrlがnullの場合、フォールバックのUserアイコンがレンダリングされること', async () => {
      // アバターURLがnullのデータを返す
      mockFetchResponseOk<ReviewComment[]>([
        createMockComment('1', 'no-avatar', 'Text', null)
      ]);
      
      const { container } = render(<IssueComments {...baseProps} />);
      
      await screen.findByText('no-avatar'); // レンダリング完了待ち
      
      // imgタグが存在しないことを確認
      const imgElement = screen.queryByRole('img');
      expect(imgElement).not.toBeInTheDocument();
      
      // フォールバック用のUserアイコン（lucide-react）はsvgタグとして描画される
      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });
  });

  // =========================================================
  // 3. コメント送信フォームのテスト
  // =========================================================
  describe('コメント送信機能', () => {
    beforeEach(() => {
      // 初期描画のためのGETリクエストを成功させておく（空のリスト）
      mockFetchResponseOk<ReviewComment[]>([]);
    });

    it('空白のみ入力された場合、送信ボタンは無効化(disabled)されること', async () => {
      render(<IssueComments {...baseProps} />);
      
      // フォームが表示されるのを待機
      const input = await screen.findByPlaceholderText('コメントを入力してください...');
      const submitButton = screen.getByRole('button', { name: '送信' });

      // 初期状態は無効
      expect(submitButton).toBeDisabled();

      // スペースのみを入力
      await userEvent.type(input, '   ');
      
      // trim()のロジックにより、依然として無効であること
      expect(submitButton).toBeDisabled();
    });

    it('コメントの送信に成功した場合、一覧に追加されフォームがクリアされること', async () => {
      render(<IssueComments {...baseProps} />);
      const input = await screen.findByPlaceholderText('コメントを入力してください...');
      const submitButton = screen.getByRole('button', { name: '送信' });

      // ユーザーがテキストを入力
      await userEvent.type(input, 'New test comment');
      expect(submitButton).not.toBeDisabled();

      // POSTリクエストに対するモックを設定（新しく作成されたコメントを返す）
      const newCommentData = createMockComment('999', 'currentUser', 'New test comment');
      mockFetchResponseOk<ReviewComment>(newCommentData);

      // 送信ボタンをクリック
      await userEvent.click(submitButton);

      // fetchが正しい引数でPOSTメソッドとして呼ばれたか検証
      expect(fetchMock).toHaveBeenCalledWith(`/api/issues/${baseProps.issueNumber}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: baseProps.owner,
          repo: baseProps.repo,
          body: 'New test comment',
        }),
      });

      // 新しいコメントが画面に追加されたか確認
      expect(await screen.findByText('currentUser')).toBeInTheDocument();
      expect(screen.getByText('New test comment')).toBeInTheDocument();

      // フォームが空にリセットされたか確認
      expect(input).toHaveValue('');
    });

    it('コメント送信APIがエラーになった場合、alertが表示されること', async () => {
      render(<IssueComments {...baseProps} />);
      const input = await screen.findByPlaceholderText('コメントを入力してください...');
      const submitButton = screen.getByRole('button', { name: '送信' });

      await userEvent.type(input, 'Failed comment');

      // POSTリクエストがエラーを返すようにモック
      mockFetchResponseError('Internal Server Error');

      await userEvent.click(submitButton);

      // alert関数が正しく呼ばれたか検証（コードの95行目のロジック）
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('コメントの送信に失敗しました');
      });
    });
  });

});