/**
 * 💡 MarkdownRendererコンポーネントのテスト
 *
 * テスト対象:
 * - MarkdownRenderer
 * 
 * テストのポイント:
 * - react-markdownのcomponents上書きが正しく機能しているか
 * - 見出し(h1-h6)に scroll-mt-20 クラスが付与されるか
 * - インラインコード、複数行コード、Mermaidが正しく判定され、適切なコンポーネントが呼ばれるか
 * - 画像タグがImageProxyに正しく変換され、imageRef(contentRef優先)のロジックが機能するか
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MarkdownRenderer } from './MarkdownRenderer'; // ※実際の相対パスに合わせて調整

// ---------------------------------------------------------
// 🛠 モック(Mock)の設定
// 複雑な子コンポーネントとプラグインをすべてシンプルな替玉にします
// ---------------------------------------------------------

// プラグインのモック（AST変換の複雑な処理をスキップ）
jest.mock('@/lib/markdown/plugins', () => ({
  remarkPlugins: [],
  rehypePlugins: [],
}));

// ReviewCommentHandlerのモック（必ずchildrenをレンダリングするようにする！）
jest.mock('@/components/review/ReviewCommentHandler', () => ({
  ReviewCommentHandler: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-review-handler">{children}</div>
  )
}));

// 各カスタムコンポーネントのモック（渡されたPropsを属性として記録）
jest.mock('./CodeBlock', () => ({
  CodeBlock: (props: any) => <div data-testid="mock-code-block" {...props} />
}));

jest.mock('./ImageProxy', () => ({
  ImageProxy: (props: any) => <div data-testid="mock-image-proxy" {...props} />
}));

jest.mock('./MermaidDiagram', () => ({
  MermaidDiagram: (props: any) => <div data-testid="mock-mermaid-diagram" {...props} />
}));

describe('MarkdownRenderer コンポーネント', () => {

  const baseProps = {
    owner: 'test-owner',
    repo: 'test-repo',
    tag: 'main',
    filePath: 'README.md',
    content: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('見出し (Headers) のレンダリング', () => {
    it('should add scroll-mt-20 class to headings', () => {
      // 1. Arrange & Act (見出しを含むMarkdownを渡す)
      const markdown = '# Heading 1\n## Heading 2';
      render(<MarkdownRenderer {...baseProps} content={markdown} />);
      
      // 2. Assert
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      
      expect(h1).toHaveClass('scroll-mt-20');
      expect(h2).toHaveClass('scroll-mt-20');
      expect(h1).toHaveTextContent('Heading 1');
    });
  });

  describe('コードブロック (Code / Mermaid) のレンダリング', () => {
    it('should render inline code using CodeBlock with inline={true}', () => {
      // 1. Arrange & Act (インラインコード)
      const markdown = 'This is `const x = 1;` inline code.';
      render(<MarkdownRenderer {...baseProps} content={markdown} />);
      
      // 2. Assert
      const codeBlock = screen.getByTestId('mock-code-block');
      expect(codeBlock).toBeInTheDocument();
      // trueの場合は文字列の"true"としてDOMに反映されるため文字列表現で確認
      expect(codeBlock).toHaveAttribute('inline', 'true');
      expect(codeBlock).toHaveTextContent('const x = 1;');
    });

    it('should render multi-line code using CodeBlock with inline={false}', () => {
      // 1. Arrange & Act (複数行コード)
      const markdown = '```javascript\nconsole.log("hello");\n```';
      render(<MarkdownRenderer {...baseProps} content={markdown} />);
      
      // 2. Assert
      const codeBlock = screen.getByTestId('mock-code-block');
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock).toHaveAttribute('inline', 'false');
      expect(codeBlock).toHaveAttribute('class', 'language-javascript');
    });

    it('should render MermaidDiagram when language is mermaid', () => {
      // 1. Arrange & Act (Mermaidコード)
      const markdown = '```mermaid\ngraph TD;\nA-->B;\n```';
      render(<MarkdownRenderer {...baseProps} content={markdown} />);
      
      // 2. Assert
      const mermaidDiagram = screen.getByTestId('mock-mermaid-diagram');
      const codeBlock = screen.queryByTestId('mock-code-block');
      
      expect(mermaidDiagram).toBeInTheDocument();
      expect(mermaidDiagram).toHaveAttribute('chart', 'graph TD;\nA-->B;');
      // 通常のCodeBlockは呼ばれないことを確認
      expect(codeBlock).not.toBeInTheDocument();
    });
  });

  describe('画像 (Images) のレンダリングと imageRef ロジック', () => {
    it('should render ImageProxy with correct props', () => {
      // 1. Arrange & Act
      const markdown = '![Alt text](./image.png)';
      render(<MarkdownRenderer {...baseProps} content={markdown} />);
      
      // 2. Assert
      const imageProxy = screen.getByTestId('mock-image-proxy');
      expect(imageProxy).toBeInTheDocument();
      expect(imageProxy).toHaveAttribute('src', './image.png');
      expect(imageProxy).toHaveAttribute('alt', 'Alt text');
      // contentRefがない場合は、tag('main')がimageRefとして使われる
      expect(imageProxy).toHaveAttribute('tag', 'main');
    });

    it('should prioritize contentRef over tag for imageRef if contentRef is provided', () => {
      // 1. Arrange & Act (contentRefを明示的に渡す)
      const markdown = '![](./image.png)';
      render(<MarkdownRenderer {...baseProps} content={markdown} contentRef="feature-branch" />);
      
      // 2. Assert
      const imageProxy = screen.getByTestId('mock-image-proxy');
      // コード内の `const imageRef = contentRef || tag;` のロジック検証
      expect(imageProxy).toHaveAttribute('tag', 'feature-branch');
    });
  });

  describe('ラッパーコンポーネント', () => {
    it('should wrap content inside ReviewCommentHandler', () => {
      // 1. Arrange & Act
      render(<MarkdownRenderer {...baseProps} content="test content" />);
      
      // 2. Assert
      const handler = screen.getByTestId('mock-review-handler');
      expect(handler).toBeInTheDocument();
      // Markdownの本文がちゃんとHandlerの中に描画されているか
      expect(handler).toHaveTextContent('test content');
    });
  });

});