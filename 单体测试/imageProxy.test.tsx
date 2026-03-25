/**
 * 💡 ImageProxyコンポーネントのテスト
 *
 * テスト対象:
 * - ImageProxy
 * 
 * テストのポイント:
 * - srcがない場合、何もレンダリングされない(nullを返す)こと
 * - convertImagePath関数が正しい引数で呼び出されること
 * - 変換されたプロキシURLがimgタグのsrcに正しくセットされること
 * - altが渡されない場合、デフォルトで空文字('')がセットされること
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageProxy } from './ImageProxy'; // ※実際の相対パスに合わせて調整
// モック化するために元の関数をimport
import { convertImagePath } from '@/lib/markdown/utils';

// ---------------------------------------------------------
// 🛠 モック(Mock)の設定
// 外部のユーティリティ関数を替玉（モック）にします
// ---------------------------------------------------------
jest.mock('@/lib/markdown/utils', () => ({
  convertImagePath: jest.fn(),
}));

describe('ImageProxy コンポーネント', () => {

  // テストで共通して使う基本のPropsを定義しておくと便利です
  const baseProps = {
    owner: 'test-owner',
    repo: 'test-repo',
    tag: 'main',
    filePath: 'docs/README.md',
  };

  // 各テストの前にモックの呼び出し履歴をリセットする
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('srcプロパティが存在しない場合', () => {
    it('should return null and render nothing when src is undefined', () => {
      // 1. Arrange & Act (srcを渡さずにレンダリング)
      const { container } = render(<ImageProxy {...baseProps} />);
      
      // 2. Assert
      // コンテナの中身が空（nullが返されている）であることを確認
      expect(container.firstChild).toBeNull();
      // 外部関数も呼ばれていないことを確認（早期リターンしているから）
      expect(convertImagePath).not.toHaveBeenCalled();
    });
  });

  describe('srcプロパティが存在する場合', () => {
    it('should call convertImagePath with correct arguments and render image', () => {
      // 1. Arrange (準備)
      const mockSrc = './images/sample.png';
      const expectedProxyUrl = 'https://mock-proxy.com/sample.png';
      
      // 替玉の関数が呼ばれたら、この固定のURLを返すように設定
      (convertImagePath as jest.Mock).mockReturnValue(expectedProxyUrl);

      // 2. Act (実行)
      render(<ImageProxy {...baseProps} src={mockSrc} alt="Sample Image" />);

      // 3. Assert (検証)
      // ① ユーティリティ関数が正しい引数で呼ばれたか？
      expect(convertImagePath).toHaveBeenCalledWith(
        mockSrc,
        baseProps.owner,
        baseProps.repo,
        baseProps.tag,
        baseProps.filePath
      );

      // ② 画像が画面にレンダリングされているか？
      const imgElement = screen.getByRole('img');
      expect(imgElement).toBeInTheDocument();

      // ③ imgタグの属性が正しいか？
      expect(imgElement).toHaveAttribute('src', expectedProxyUrl);
      expect(imgElement).toHaveAttribute('alt', 'Sample Image');
      expect(imgElement).toHaveClass('max-w-full', 'h-auto', 'rounded-lg', 'border');
      expect(imgElement).toHaveAttribute('loading', 'lazy');
    });

    it('should fallback to empty string when alt prop is missing', () => {
      // 1. Arrange (準備)
      const mockSrc = './images/sample.png';
      (convertImagePath as jest.Mock).mockReturnValue('https://mock.com/img.png');

      // 2. Act (実行: altを渡さない)
      render(<ImageProxy {...baseProps} src={mockSrc} />);

      // 3. Assert (検証)
      const imgElement = screen.getByRole('img');
      // コード内の `alt={alt || ''}` のロジックにより、空文字になることを確認
      expect(imgElement).toHaveAttribute('alt', '');
    });
  });

});