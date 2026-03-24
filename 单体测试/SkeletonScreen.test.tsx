import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// 注意：这里的路径请根据你的实际目录结构调整
// 如果测试文件和原文件在同一个目录下，用 './SkeletonScreen' 即可
import { 
  Skeleton, 
  DashboardSkeleton, 
  ViewerSkeleton, 
  CardSkeleton, 
  ListSkeleton 
} from './SkeletonScreen';

describe('SkeletonScreen コンポーネントの単体テスト', () => {

  // ---------------------------------------------------------
  // 1. 基本となる Skeleton コンポーネントのテスト
  // ---------------------------------------------------------
  describe('Skeleton (基本コンポーネント)', () => {
    
    it('デフォルトのクラス（animate-pulse 等）が付与されてレンダリングされること', () => {
      // 1. Arrange & Act (準備と実行)
      const { container } = render(<Skeleton />);
      
      // 2. Assert (検証)
      // container.firstChild はレンダリングされた一番外側の <div> を指します
      expect(container.firstChild).toBeInTheDocument();
      // デフォルトのTailwindクラスが当たっているか確認
      expect(container.firstChild).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
    });

    it('追加の className が正しくマージされること', () => {
      // 1. Arrange & Act
      // カスタムクラス "h-10 w-full" を渡してみる
      const { container } = render(<Skeleton className="h-10 w-full" />);
      
      // 2. Assert
      expect(container.firstChild).toBeInTheDocument();
      // デフォルトのクラスに加えて、渡したカスタムクラスも存在することを確認
      expect(container.firstChild).toHaveClass('animate-pulse', 'h-10', 'w-full');
    });
  });

  // ---------------------------------------------------------
  // 2. DashboardSkeleton コンポーネントのテスト
  // ---------------------------------------------------------
  describe('DashboardSkeleton', () => {
    it('エラーにならず正常にレンダリングされること', () => {
      // 1. Arrange & Act
      const { container } = render(<DashboardSkeleton />);
      
      // 2. Assert
      expect(container.firstChild).toBeInTheDocument();
      // ヘッダーやメインコンテンツの枠組みが描画されているか、ざっくり確認
      expect(container.firstChild).toHaveClass('flex', 'min-h-screen', 'flex-col');
    });
  });

  // ---------------------------------------------------------
  // 3. ViewerSkeleton コンポーネントのテスト
  // ---------------------------------------------------------
  describe('ViewerSkeleton', () => {
    it('エラーにならず正常にレンダリングされること', () => {
      // 1. Arrange & Act
      const { container } = render(<ViewerSkeleton />);
      
      // 2. Assert
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------
  // 4. CardSkeleton コンポーネントのテスト
  // ---------------------------------------------------------
  describe('CardSkeleton', () => {
    it('エラーにならず正常にレンダリングされること', () => {
      // 1. Arrange & Act
      const { container } = render(<CardSkeleton />);
      
      // 2. Assert
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------
  // 5. ListSkeleton コンポーネントのテスト (Propsのテスト)
  // ---------------------------------------------------------
  describe('ListSkeleton', () => {
    
    it('Props を渡さない場合、デフォルトで 5 つのリストアイテムが描画されること', () => {
      // 1. Arrange & Act
      const { container } = render(<ListSkeleton />);
      
      // 2. Assert
      expect(container.firstChild).toBeInTheDocument();
      // リストの外側の div の中にある子要素（リストアイテム）の数が 5 つであること
      expect(container.firstChild?.childNodes.length).toBe(5);
    });

    it('count プロパティに 3 を渡した場合、3 つのリストアイテムが描画されること', () => {
      // 1. Arrange & Act
      // count={3} を渡してコンポーネントを描画
      const { container } = render(<ListSkeleton count={3} />);
      
      // 2. Assert
      expect(container.firstChild).toBeInTheDocument();
      // 子要素の数が指定通り 3 つになっていることを確認！
      expect(container.firstChild?.childNodes.length).toBe(3);
    });
  });

});