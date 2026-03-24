/**
 * 💡 CodeBlock関連コンポーネントのテスト
 *
 * テスト対象:
 * - CodeBlock
 * 
 * テストのポイント:
 * - inlineプロパティがtrueの場合、シンプルな<code>タグとしてレンダリングされるか
 * - inlineプロパティがfalsyの場合、SyntaxHighlighterがレンダリングされるか
 * - className（例: "language-javascript"）から正しく言語を抽出できるか
 * - 言語指定がない場合、デフォルトで"text"が適用されるか
 * - 末尾の改行(\n)が正しく削除されるか
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CodeBlock } from './CodeBlock'; // ※実際の相対パスに合わせて調整してください

// ---------------------------------------------------------
// 🛠 モック(Mock)の設定
// サードパーティの複雑なUIライブラリは、テストを安定させるためにシンプルな替玉にします
// ---------------------------------------------------------
jest.mock('react-syntax-highlighter', () => {
  return {
    // Prismコンポーネントの替玉（渡されたPropsをHTMLの属性として記録するだけ）
    Prism: ({ children, language, showLineNumbers }: any) => (
      <div 
        data-testid="mock-prism" 
        data-language={language} 
        data-line-numbers={showLineNumbers}
      >
        {children}
      </div>
    )
  };
});

// スタイルのインポートもエラーを防ぐために空オブジェクトとしてモック化
jest.mock('react-syntax-highlighter/dist/cjs/styles/prism', () => ({
  vscDarkPlus: {}
}));

describe('CodeBlock コンポーネント', () => {

  // テスト間の影響をなくすため、毎回モックをクリア
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('インラインコードの場合 (inline={true})', () => {
    it('should render simple <code> tag when inline is true', () => {
      // 1. Arrange & Act
      render(<CodeBlock inline={true}>const x = 1;</CodeBlock>);
      
      // 2. Assert
      // 画面上のテキストから要素を探す
      const codeElement = screen.getByText('const x = 1;');
      
      expect(codeElement).toBeInTheDocument();
      // タグ名がCODEであることを確認
      expect(codeElement.tagName).toBe('CODE');
      // インライン用のTailwindクラスが当たっているか確認
      expect(codeElement).toHaveClass('px-1.5', 'py-0.5', 'rounded', 'bg-muted');
    });
  });

  describe('複数行コードブロックの場合 (inline={false} or undefined)', () => {
    
    it('should render SyntaxHighlighter with correctly extracted language', () => {
      // 1. Arrange & Act
      // Markdownのパーサーは通常、コードブロックの言語をclassNameとして渡します
      render(
        <CodeBlock className="language-typescript">
          const message: string = "Hello";
        </CodeBlock>
      );
      
      // 2. Assert
      // 替玉のPrismコンポーネントを取得
      const prismMock = screen.getByTestId('mock-prism');
      
      expect(prismMock).toBeInTheDocument();
      // "language-typescript" から "typescript" が正しく抽出され、渡されていること！
      expect(prismMock).toHaveAttribute('data-language', 'typescript');
      // 行番号表示が有効になっていること
      expect(prismMock).toHaveAttribute('data-line-numbers', 'true');
      expect(prismMock).toHaveTextContent('const message: string = "Hello";');
    });

    it('should fallback to "text" language when className does not contain language info', () => {
      // 1. Arrange & Act
      // 言語情報を含まないクラス名を渡す
      render(
        <CodeBlock className="some-random-class">
          Plain text here
        </CodeBlock>
      );
      
      // 2. Assert
      const prismMock = screen.getByTestId('mock-prism');
      // 正規表現にマッチしないため、デフォルトの 'text' が適用されること
      expect(prismMock).toHaveAttribute('data-language', 'text');
    });

    it('should remove the trailing newline from the code string', () => {
      // 1. Arrange & Act
      // 末尾に改行コード(\n)を含む文字列を渡す
      render(
        <CodeBlock className="language-javascript">
          {"console.log('test');\n"}
        </CodeBlock>
      );
      
      // 2. Assert
      const prismMock = screen.getByTestId('mock-prism');
      // 正規表現 replace(/\n$/, '') によって末尾の改行が消えていること
      expect(prismMock).toHaveTextContent("console.log('test');");
    });
  });

});