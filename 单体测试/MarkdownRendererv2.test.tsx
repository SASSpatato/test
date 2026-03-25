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

import React, { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MarkdownRenderer } from './MarkdownRenderer';

// ---------------------------------------------------------
// 🛠 型定義 (Mock用)
// any を使用せず、厳密な型定義を行います
// ---------------------------------------------------------

interface ReviewCommentHandlerProps {
  children: ReactNode;
}

// 実際のコンポーネントが受け取るPropsの型を簡易的に定義
interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  className?: string;
  children?: ReactNode;
}

interface ImageProxyProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  tag?: string;
}

interface MermaidDiagramProps {
  chart: string;
}

// ---------------------------------------------------------
// 🛠 モック(Mock)の設定
// Babelのパースエラーを防ぐため、引数の分割代入と型定義を分離しています
// ---------------------------------------------------------

// プラグインのモック
jest.mock('@/lib/markdown/plugins', () => ({
  remarkPlugins: [],
  rehypePlugins: [],
}));

// ReviewCommentHandlerのモック
jest.mock('@/components/review/ReviewCommentHandler', () => ({
  ReviewCommentHandler: (props: ReviewCommentHandlerProps) => (
    <div data-testid="mock-review-handler">{props.children}</div>
  )
}));

// CodeBlockのモック（DOM属性としてPropsを出力し、検証可能にする）
jest.mock('./CodeBlock', () => ({
  CodeBlock: (props: CodeBlockProps) => {
    // boolean型のProps(inline)は、DOM属性として出力するために文字列に変換
    const inlineStr = props.inline !== undefined ? String(props.inline) : undefined;
    return (
      <div 
        data-testid="mock-code-block" 
        data-inline={inlineStr}
        className={props.className}
      >
        {props.children}
      </div>
    );
  }
}));

// ImageProxyのモック
jest.mock('./ImageProxy', () => ({
  ImageProxy: (props: ImageProxyProps) => (
    <div 
      data-testid="mock-image-proxy" 
      data-src={props.src}
      data-alt={props.alt}
      data-tag={props.tag}
    />
  )
}));

// MermaidDiagramのモック
jest.mock('./MermaidDiagram', () => ({
  MermaidDiagram: (props: MermaidDiagramProps) => (
    <div data-testid="mock-mermaid-diagram" data-chart={props.chart} />
  )
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
      const markdown = '# Heading 1\n## Heading 2';
      render(<MarkdownRenderer {...baseProps} content={markdown} />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      
      expect(h1).toHaveClass('scroll-mt-20');
      expect(h2).toHaveClass('scroll-mt-20');
      expect(h1).toHaveTextContent('Heading 1');
    });
  });

  describe('コードブロック (Code / Mermaid) のレンダリング', () => {
    it('should render inline code using CodeBlock with inline={true}', () => {
      const markdown = 'This is `const x = 1;` inline code.';
      render(<MarkdownRenderer {...baseProps} content={markdown} />);
      
      const codeBlock = screen.getByTestId('mock-code-block');
      expect(codeBlock).toBeInTheDocument();
      // data-属性で検証
      expect(codeBlock).toHaveAttribute('data-inline', 'true');
      expect(codeBlock).toHaveTextContent('const x = 1;');
    });

    it('should render multi-line code using CodeBlock with inline={false}', () => {
      const markdown = '```javascript\nconsole.log("hello");\n```';
      render(<MarkdownRenderer {...baseProps} content={markdown} />);
      
      const codeBlock = screen.getByTestId('mock-code-block');
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock).toHaveAttribute('data-inline', 'false');
      // カスタムコンポーネントに渡されたclassNameが、モックのDOM要素のclassとして出力されているか
      expect(codeBlock).toHaveClass('language-javascript');
    });

    it('should render MermaidDiagram when language is mermaid', () => {
      const markdown = '```mermaid\ngraph TD;\nA-->B;\n```';
      render(<MarkdownRenderer {...baseProps} content={markdown} />);
      
      const mermaidDiagram = screen.getByTestId('mock-mermaid-diagram');
      const codeBlock = screen.queryByTestId('mock-code-block');
      
      expect(mermaidDiagram).toBeInTheDocument();
      // data-属性で検証
      expect(mermaidDiagram).toHaveAttribute('data-chart', 'graph TD;\nA-->B;');
      
      // 通常のCodeBlockは呼ばれないはず
      expect(codeBlock).not.toBeInTheDocument();
    });
  });

  describe('画像 (Images) のレンダリングと imageRef ロジック', () => {
    it('should render ImageProxy with correct props', () => {
      const markdown = '![Alt text](./image.png)';
      render(<MarkdownRenderer {...baseProps} content={markdown} />);
      
      const imageProxy = screen.getByTestId('mock-image-proxy');
      expect(imageProxy).toBeInTheDocument();
      // data-属性で検証
      expect(imageProxy).toHaveAttribute('data-src', './image.png');
      expect(imageProxy).toHaveAttribute('data-alt', 'Alt text');
      // contentRefがない場合はtagが使われる
      expect(imageProxy).toHaveAttribute('data-tag', 'main');
    });

    it('should prioritize contentRef over tag for imageRef if contentRef is provided', () => {
      const markdown = '![](./image.png)';
      render(<MarkdownRenderer {...baseProps} content={markdown} contentRef="feature-branch" />);
      
      const imageProxy = screen.getByTestId('mock-image-proxy');
      // contentRefが優先されているか検証
      expect(imageProxy).toHaveAttribute('data-tag', 'feature-branch');
    });
  });

  describe('ラッパーコンポーネント', () => {
    it('should wrap content inside ReviewCommentHandler', () => {
      render(<MarkdownRenderer {...baseProps} content="test content" />);
      
      const handler = screen.getByTestId('mock-review-handler');
      expect(handler).toBeInTheDocument();
      expect(handler).toHaveTextContent('test content');
    });
  });

});